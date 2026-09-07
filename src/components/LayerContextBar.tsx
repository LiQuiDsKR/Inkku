import { useRef } from 'react';
import type { ReorderCommand } from '@/layers/order';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { Layer } from '@/layers/types';

/**
 * 라벨을 앞/뒤가 아니라 위/아래로 쓴다.
 * 상단 바에도 "뒤로"(편집 나가기)가 있어서 같은 화면에 같은 글자가 두 개 보이면 헷갈린다.
 */
const ORDER_ACTIONS: readonly { command: ReorderCommand; label: string }[] = [
  { command: 'back', label: '맨 아래' },
  { command: 'backward', label: '아래로' },
  { command: 'forward', label: '위로' },
  { command: 'front', label: '맨 위' },
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
    /*
     * 흐름에서 빠져 툴바 위에 떠 있는다.
     * 흐름에 두면 레이어를 고를 때마다 바가 나타났다 사라지면서 캔버스가 위아래로 튄다.
     * 손으로 맞춰 둔 위치가 매번 움직이는 것처럼 보여서 편집이 어렵다.
     */
    <div className="absolute inset-x-0 bottom-full z-40 border-t border-ink-line bg-ink-panel/95 px-3 py-2">
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
