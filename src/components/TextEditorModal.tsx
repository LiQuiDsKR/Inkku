import { useLayoutEffect, useRef, useState } from 'react';
import Icon from './icons/Icon';
import TextStyleControls from './TextStyleControls';
import { createTextLayer } from '@/layers/factory';
import { getRatioSize } from '@/layers/ratio';
import { createTextDraft, draftFromLayer, draftToPatch, type TextDraft } from '@/layers/textDraft';
import { defaultTextShadow, defaultTextStroke } from '@/layers/textStyle';
import { useFontReady } from '@/fonts/useFontReady';
import { findFont } from '@/fonts/catalog';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { TextEditorTarget } from '@/store/toolStore';
import type { TextLayer } from '@/layers/types';

/**
 * 입력 글자의 축소 배율.
 * 캔버스는 긴 변 1080 논리 좌표를 쓰는데 모달은 폰 화면 폭이라, 같은 fontSize를 그대로 쓰면
 * 글자가 화면을 뚫고 나간다. 실제 비율감만 전달되면 되므로 고정 배율로 줄인다.
 */
const PREVIEW_SCALE = 0.3;

interface TextEditorModalProps {
  target: TextEditorTarget;
  onClose: () => void;
}

function initialDraft(target: TextEditorTarget, layer: TextLayer | null): TextDraft {
  if (target.mode === 'edit' && layer) return draftFromLayer(layer);
  return createTextDraft();
}

/**
 * 글자 입력.
 *
 * 화면을 불투명하게 덮지 않는다. 사진 위에 얹을 글이라 뒤에 무엇이 있는지 보면서 써야
 * 색과 크기를 고를 수 있다. 그래서 반투명 검은 막만 깔고 그 위에서 바로 친다.
 * 입력칸이 곧 미리보기다. 따로 미리보기 상자를 두면 같은 글이 화면에 두 번 나와 헷갈린다.
 */
export default function TextEditorModal({ target, onClose }: TextEditorModalProps) {
  const editingId = target.mode === 'edit' ? target.layerId : null;

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const updateTextLayer = useProjectStore((state) => state.updateTextLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const select = useSelectionStore((state) => state.select);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 모달이 열릴 때의 값만 필요하다. 편집 중 스토어 변화를 구독하면 입력이 되돌아간다.
  const [draft, setDraft] = useState<TextDraft>(() => {
    const found = useProjectStore.getState().project?.layers.find((layer) => layer.id === editingId);
    return initialDraft(target, found && found.type === 'text' ? found : null);
  });

  // 입력칸이 곧 미리보기라 고른 즉시 폰트를 받아 둬야 한다
  useFontReady(draft.fontId, draft.content);

  /**
   * 줄이 늘어난 만큼 입력칸도 늘린다.
   * 고정 높이로 두면 두 줄째부터 스크롤이 생겨서, 지금 쓰는 글의 전체 모양을 볼 수 없다.
   */
  useLayoutEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [draft.content, draft.fontSize, draft.fontId, draft.align]);

  const patch = (next: Partial<TextDraft>) => setDraft((prev) => ({ ...prev, ...next }));

  const handleConfirm = () => {
    const content = draft.content.trim();

    if (editingId) {
      // 글자를 다 지우고 완료하면 지우려는 의도로 본다. 빈 레이어는 잡을 수도 없다.
      if (content.length === 0) removeLayer(editingId);
      else updateTextLayer(editingId, draftToPatch({ ...draft, content }));
      onClose();
      return;
    }

    if (content.length === 0 || !ratio) {
      onClose();
      return;
    }

    const size = getRatioSize(ratio);
    const layer = createTextLayer({
      draft: { ...draft, content },
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
    });
    addLayers([layer]);
    select(layer.id);
    onClose();
  };

  const stroke = draft.stroke ? defaultTextStroke(draft.fontSize) : null;
  const shadow = draft.shadow ? defaultTextShadow(draft.fontSize) : null;

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-[2px]">
      <header className="flex shrink-0 items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-2 text-body-lg text-white/70"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 text-title-md text-on-primary-container transition-transform active:scale-95"
        >
          완료
          <Icon name="check" size={16} />
        </button>
      </header>

      {/*
        조작은 위에 둔다.
        아래에 두면 키보드가 올라오는 순간 통째로 가려서, 색이나 폰트를 바꾸려면
        키보드를 내렸다 올렸다 해야 한다.
      */}
      <div className="shrink-0 px-4 pb-2">
        <TextStyleControls draft={draft} onChange={patch} />
      </div>

      {/*
        빈 곳을 누르면 다시 입력칸으로 들어간다.
        조작을 만지다가 키보드가 내려갔을 때 다시 칠 곳을 찾아 헤매지 않게 한다.
      */}
      <div
        className="scroll-contain flex min-h-0 flex-1 justify-center overflow-y-auto px-5 pt-6"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
      >
        <textarea
          ref={inputRef}
          value={draft.content}
          onChange={(event) => patch({ content: event.currentTarget.value })}
          rows={1}
          autoFocus
          placeholder="글자 입력"
          className="h-auto w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-white/35"
          style={{
            fontFamily: findFont(draft.fontId).family,
            fontSize: draft.fontSize * PREVIEW_SCALE,
            lineHeight: 1.25,
            color: draft.color,
            textAlign: draft.align,
            // 글자가 어두운 색일 때 커서까지 안 보이면 어디를 치고 있는지 알 수 없다
            caretColor: '#ffffff',
            WebkitTextStrokeWidth: stroke ? stroke.width * PREVIEW_SCALE : undefined,
            WebkitTextStrokeColor: stroke?.color,
            // 기본값은 외곽선이 글자 위를 덮어 얇은 획을 먹는다. 캔버스와 같은 순서로 그린다.
            paintOrder: 'stroke fill',
            textShadow: shadow
              ? `${shadow.offsetX * PREVIEW_SCALE}px ${shadow.offsetY * PREVIEW_SCALE}px ${
                  shadow.blur * PREVIEW_SCALE
                }px ${shadow.color}`
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
