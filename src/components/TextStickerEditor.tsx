import { useEffect, useRef, useState } from 'react';
import Icon from './icons/Icon';
import StickerColorTab from './StickerColorTab';
import StickerEditStage from './StickerEditStage';
import { StickerFontRow, StickerPresetRow } from './StickerPickRows';
import StickerShapeTab from './StickerShapeTab';
import TabChip from './TabChip';
import { getRatioSize } from '@/layers/ratio';
import {
  createTextStickerLayer,
  type StickerPlate,
  type TextStickerStyle,
} from '@/layers/textSticker';
import { layoutTextSticker } from '@/layers/textStickerLayout';
import { findTextStickerPreset, TEXT_STICKER_PRESETS } from '@/layers/textStickerPresets';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { StickerEditorTarget } from '@/store/toolStore';

type EditorTab = 'style' | 'font' | 'color' | 'shape';

const TABS: readonly { id: EditorTab; label: string }[] = [
  { id: 'style', label: '스타일' },
  { id: 'font', label: '글꼴' },
  { id: 'color', label: '색' },
  { id: 'shape', label: '도형' },
];

interface StickerDraft {
  text: string;
  style: TextStickerStyle;
}

function initialDraft(target: StickerEditorTarget): StickerDraft {
  if (target.mode === 'edit') {
    const layer = useProjectStore
      .getState()
      .project?.layers.find((item) => item.id === target.layerId);
    if (layer?.type === 'textSticker') return { text: layer.text, style: layer.style };
  }
  const preset =
    target.mode === 'create' ? findTextStickerPreset(target.presetId) : TEXT_STICKER_PRESETS[0];
  return { text: preset?.sample ?? '', style: preset?.style ?? { fontId: 'system', color: '#22242a' } };
}

interface TextStickerEditorProps {
  target: StickerEditorTarget;
  onClose: () => void;
}

/**
 * 문구 스티커 편집 화면.
 *
 * 글자 모달처럼 화면을 불투명하게 덮지 않는다. 사진 위에 붙일 것이라 뒤가 보여야 색을 고를 수 있다.
 * 조작은 위에 둔다. 아래에 두면 키보드가 통째로 가린다.
 * 고르는 동안은 화면 안의 초안만 바뀌고, 완료를 눌러야 한 번에 레이어가 된다.
 * 하나 고를 때마다 레이어를 고치면 실행취소 한 번에 색 하나씩 되돌아간다.
 */
export default function TextStickerEditor({ target, onClose }: TextStickerEditorProps) {
  const editingId = target.mode === 'edit' ? target.layerId : null;

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const updateTextStickerLayer = useProjectStore((state) => state.updateTextStickerLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const select = useSelectionStore((state) => state.select);

  // 열릴 때의 값만 필요하다. 편집 중 스토어 변화를 구독하면 고르던 것이 되돌아간다
  const [draft, setDraft] = useState<StickerDraft>(() => initialDraft(target));
  const [tab, setTab] = useState<EditorTab>('style');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 도형을 없앴다가 다시 고르면 전에 쓰던 색과 흐림이 돌아와야 한다
  const lastPlate = useRef<StickerPlate | null>(draft.style.plate ?? null);

  /*
   * 새로 만들 때는 견본 문구를 골라 둔 채로 연다.
   * 바로 치면 내 문구로 바뀌고, 그대로 완료하면 견본 문구가 붙는다.
   */
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (target.mode === 'create') input.select();
    // 열릴 때 한 번만 한다. 탭을 바꿀 때마다 다시 고르면 친 문구가 통째로 선택된다
  }, []);

  const setStyle = (style: TextStickerStyle) => {
    if (style.plate) lastPlate.current = style.plate;
    setDraft((prev) => ({ ...prev, style }));
  };

  /**
   * 탭을 바꾸면 키보드를 내린다. 아이폰은 키보드가 화면의 절반을 덮어서
   * 색과 도형 줄을 펼치면 스티커가 보일 자리가 남지 않는다. 스티커를 누르면 다시 올라온다.
   */
  const chooseTab = (next: EditorTab) => {
    inputRef.current?.blur();
    setTab(next);
  };

  const handleConfirm = () => {
    // 앞뒤 빈 줄과 공백은 도형만 키운다. 사이의 줄바꿈은 사용자가 정한 것이라 남긴다
    const text = draft.text.replace(/^\s+|\s+$/g, '');

    if (editingId) {
      // 문구를 다 지우고 완료하면 지우려는 뜻으로 본다. 빈 스티커는 잡을 수도 없다
      if (text.length === 0) removeLayer(editingId);
      else updateTextStickerLayer(editingId, { text, style: draft.style });
      onClose();
      return;
    }

    if (text.length === 0 || !ratio) {
      onClose();
      return;
    }

    const size = getRatioSize(ratio);
    const { bounds } = layoutTextSticker(text, draft.style);
    const layer = createTextStickerLayer({
      text,
      style: draft.style,
      width: bounds.width,
      height: bounds.height,
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
    });
    addLayers([layer]);
    select(layer.id);
    onClose();
  };

  const tabProps = { text: draft.text, style: draft.style, onChange: setStyle };
  const shapeProps = { style: draft.style, fallbackPlate: lastPlate.current, onChange: setStyle };

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
        <h2 className="text-title-md text-on-surface">문구 스티커</h2>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 text-title-md text-on-primary-container transition-transform active:scale-95"
        >
          완료
          <Icon name="check" size={16} />
        </button>
      </header>

      <div className="scroll-contain no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map((item) => (
          <TabChip
            key={item.id}
            label={item.label}
            active={item.id === tab}
            onClick={() => chooseTab(item.id)}
          />
        ))}
      </div>

      {/* 탭마다 높이가 다르면 바꿀 때마다 스티커가 위아래로 튄다. 높이를 고정한다 */}
      <div className="h-[184px] shrink-0 overflow-y-auto pt-1">
        {tab === 'style' && <StickerPresetRow {...tabProps} />}
        {tab === 'font' && <StickerFontRow {...tabProps} />}
        {tab === 'color' && <StickerColorTab {...shapeProps} />}
        {tab === 'shape' && <StickerShapeTab {...shapeProps} />}
      </div>

      <StickerEditStage
        text={draft.text}
        style={draft.style}
        onText={(text) => setDraft((prev) => ({ ...prev, text }))}
        inputRef={inputRef}
      />
    </div>
  );
}
