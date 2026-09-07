import { useRef } from 'react';
import type { ReorderCommand } from '@/layers/order';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { Layer } from '@/layers/types';

const ORDER_ACTIONS: readonly { command: ReorderCommand; label: string }[] = [
  { command: 'back', label: '맨뒤' },
  { command: 'backward', label: '뒤로' },
  { command: 'forward', label: '앞으로' },
  { command: 'front', label: '맨앞' },
];

const OPACITY_STEPS = 100;

interface LayerContextBarProps {
  layer: Layer;
}

/**
 * 선택된 레이어에만 적용되는 조작 모음.
 *
 * 캔버스 위에 떠 있는 버튼으로 만들지 않는다. 회전한 레이어를 따라다니게 하면
 * 버튼이 화면 밖으로 나가거나 다른 레이어를 가려서 결국 못 누른다.
 */
export default function LayerContextBar({ layer }: LayerContextBarProps) {
  const reorderLayer = useProjectStore((state) => state.reorderLayer);
  const duplicateLayer = useProjectStore((state) => state.duplicateLayer);
  const toggleFlipX = useProjectStore((state) => state.toggleFlipX);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const setLayerOpacity = useProjectStore((state) => state.setLayerOpacity);
  const select = useSelectionStore((state) => state.select);
  const clearSelection = useSelectionStore((state) => state.clear);

  /**
   * 슬라이더를 끄는 동안은 첫 변경만 히스토리에 남긴다.
   * 매 프레임 남기면 한 번 드래그에 30단계가 다 차서 실행취소가 쓸모없어진다.
   */
  const dragging = useRef(false);

  const handleOpacity = (value: number) => {
    const record = !dragging.current;
    dragging.current = true;
    setLayerOpacity(layer.id, value / OPACITY_STEPS, record);
  };

  const endOpacityDrag = () => {
    dragging.current = false;
  };

  const handleDuplicate = () => {
    const newId = duplicateLayer(layer.id);
    // 복제본을 바로 선택해야 어느 쪽이 새것인지 알 수 있다
    if (newId) select(newId);
  };

  const handleDelete = () => {
    removeLayer(layer.id);
    clearSelection();
  };

  return (
    <div className="relative z-40 shrink-0 border-t border-ink-line bg-ink-panel px-3 py-2">
      <label className="mb-2 flex items-center gap-3 text-[11px] text-ink-muted">
        <span className="w-10 shrink-0">투명도</span>
        <input
          type="range"
          min={0}
          max={OPACITY_STEPS}
          value={Math.round(layer.opacity * OPACITY_STEPS)}
          onChange={(event) => handleOpacity(Number(event.currentTarget.value))}
          onPointerUp={endOpacityDrag}
          onPointerCancel={endOpacityDrag}
          onBlur={endOpacityDrag}
          className="h-8 flex-1 accent-[var(--color-ink-accent)]"
        />
        <span className="w-8 shrink-0 text-right tabular-nums">
          {Math.round(layer.opacity * OPACITY_STEPS)}
        </span>
      </label>

      <div className="scroll-contain flex gap-1 overflow-x-auto">
        {ORDER_ACTIONS.map((action) => (
          <ContextButton
            key={action.command}
            label={action.label}
            onClick={() => reorderLayer(layer.id, action.command)}
          />
        ))}
        <ContextButton label="복제" onClick={handleDuplicate} />
        <ContextButton label="좌우반전" onClick={() => toggleFlipX(layer.id)} />
        <ContextButton label="삭제" onClick={handleDelete} danger />
      </div>
    </div>
  );
}

interface ContextButtonProps {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ContextButton({ label, onClick, danger = false }: ContextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-2 text-xs active:opacity-60 ${
        danger ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-text'
      }`}
    >
      {label}
    </button>
  );
}
