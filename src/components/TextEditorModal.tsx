import { useState } from 'react';
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
 * 미리보기 축소 배율.
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

export default function TextEditorModal({ target, onClose }: TextEditorModalProps) {
  const editingId = target.mode === 'edit' ? target.layerId : null;

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const updateTextLayer = useProjectStore((state) => state.updateTextLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const select = useSelectionStore((state) => state.select);

  // 모달이 열릴 때의 값만 필요하다. 편집 중 스토어 변화를 구독하면 입력이 되돌아간다.
  const [draft, setDraft] = useState<TextDraft>(() => {
    const found = useProjectStore.getState().project?.layers.find((layer) => layer.id === editingId);
    return initialDraft(target, found && found.type === 'text' ? found : null);
  });

  // 미리보기와 캔버스가 같은 폰트를 쓰도록 고른 즉시 받아 둔다
  useFontReady(draft.fontId, draft.content);

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
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-ink-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-ink-line px-2">
        <button type="button" onClick={onClose} className="px-3 py-3 text-sm text-ink-muted">
          취소
        </button>
        <span className="text-sm">{editingId ? '글자 수정' : '글자 넣기'}</span>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-3 py-3 text-sm font-semibold text-ink-accent"
        >
          완료
        </button>
      </header>

      <div className="scroll-contain min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/*
          미리보기 바탕은 중간 회색이다.
          어두운 패널 색을 쓰면 검은 외곽선과 그림자가 배경에 묻혀서 켜고 끈 차이가 보이지 않는다.
        */}
        <div
          className="my-4 flex min-h-24 items-center justify-center rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #6f6f78, #9a9aa4)' }}
        >
          <p
            className="w-full break-words whitespace-pre-wrap"
            style={{
              fontFamily: findFont(draft.fontId).family,
              fontSize: draft.fontSize * PREVIEW_SCALE,
              lineHeight: 1.25,
              color: draft.color,
              textAlign: draft.align,
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
          >
            {draft.content || '여기에 글자가 보인다'}
          </p>
        </div>

        <textarea
          value={draft.content}
          onChange={(event) => patch({ content: event.currentTarget.value })}
          rows={3}
          autoFocus
          placeholder="글자를 입력한다"
          className="mb-5 w-full resize-none rounded-2xl border border-ink-line bg-ink-panel p-3 text-base outline-none"
        />

        <TextStyleControls draft={draft} onChange={patch} />
      </div>
    </div>
  );
}
