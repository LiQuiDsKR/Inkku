import { useRef } from 'react';
import Icon from './icons/Icon';
import type { IconName } from './icons/paths';
import type { ReorderCommand } from '@/layers/order';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';
import type { Layer } from '@/layers/types';

/**
 * 순서 버튼은 아이콘으로 방향을 보여 준다.
 * 상단 바에도 "뒤로"(편집 나가기)가 있어서 앞/뒤라는 말을 쓰면 같은 화면에 두 뜻이 생긴다.
 */
const ORDER_ACTIONS: readonly { command: ReorderCommand; icon: IconName; label: string }[] = [
  { command: 'back', icon: 'bottom', label: '맨 아래로' },
  { command: 'backward', icon: 'down', label: '한 칸 아래로' },
  { command: 'forward', icon: 'up', label: '한 칸 위로' },
  { command: 'front', icon: 'top', label: '맨 위로' },
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
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const setLayerOpacity = useProjectStore((state) => state.setLayerOpacity);
  const select = useSelectionStore((state) => state.select);
  const clearSelection = useSelectionStore((state) => state.clear);
  const openPanel = useToolStore((state) => state.openPanel);
  const openTextEditor = useToolStore((state) => state.openTextEditor);
  const openStickerEditor = useToolStore((state) => state.openStickerEditor);

  /**
   * 슬라이더를 끄는 동안은 첫 변경만 히스토리에 남긴다.
   * 매 프레임 남기면 한 번 드래그에 30단계가 다 차서 실행취소가 쓸모없어진다.
   */
  const dragging = useRef(false);

  const percent = Math.round(layer.opacity * OPACITY_STEPS);

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
    <div className="absolute inset-x-0 bottom-full z-40 px-3 pb-2">
      <div className="glass-panel flex flex-col gap-2 rounded-3xl px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-label-md text-tertiary">
            <Icon name="opacity" size={14} />
            {percent}%
          </span>
          <input
            type="range"
            min={0}
            max={OPACITY_STEPS}
            value={percent}
            aria-label="투명도"
            onChange={(event) => handleOpacity(Number(event.currentTarget.value))}
            onPointerUp={endOpacityDrag}
            onPointerCancel={endOpacityDrag}
            onBlur={endOpacityDrag}
            className="neo-slider flex-1"
          />
          {/* 바가 그림 아래쪽을 가린다. 빈 곳을 찾아 누르지 않아도 바로 걷을 수 있게 한다 */}
          <button
            type="button"
            onClick={clearSelection}
            aria-label="선택 해제"
            title="선택 해제"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-transform active:scale-90"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5">
            {ORDER_ACTIONS.map((action) => (
              <ContextButton
                key={action.command}
                icon={action.icon}
                label={action.label}
                onClick={() => reorderLayer(layer.id, action.command)}
              />
            ))}
          </div>

          <span className="h-4 w-px bg-surface-highest" />

          <div className="flex items-center gap-0.5">
            {/* 보정과 자르기는 사진에만 있다. 다른 타입에 눌러도 할 일이 없는 버튼을 띄우지 않는다 */}
            {layer.type === 'photo' && (
              <>
                <ContextButton icon="crop" label="모양 자르기" onClick={() => openPanel('photo')} />
                <ContextButton icon="adjust" label="사진 보정" onClick={() => openPanel('photo')} />
              </>
            )}
            {/* 더블탭으로도 열리지만 알려 주지 않으면 아무도 두 번 눌러 보지 않는다 */}
            {layer.type === 'textSticker' && (
              <ContextButton
                icon="draw"
                label="문구 편집"
                onClick={() => openStickerEditor({ mode: 'edit', layerId: layer.id })}
              />
            )}
            {layer.type === 'text' && (
              <ContextButton
                icon="draw"
                label="텍스트 편집"
                onClick={() => openTextEditor({ mode: 'edit', layerId: layer.id })}
              />
            )}
            <ContextButton icon="copy" label="복제" onClick={handleDuplicate} />
            <ContextButton icon="trash" label="삭제" onClick={handleDelete} danger />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContextButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ContextButton({ icon, label, onClick, danger = false }: ContextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90 ${
        danger
          ? 'bg-error-container text-on-error-container'
          : 'bg-surface-high text-on-surface-variant'
      }`}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
