import { useRef, useState } from 'react';
import PanelSheet from './PanelSheet';
import { createShapeLayer } from '@/layers/factory';
import { getRatioSize } from '@/layers/ratio';
import { SHAPE_COLORS, SHAPE_KINDS, type ShapeKind } from '@/layers/shapeStyle';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

const CASCADE_CYCLE = 5;

interface ShapePanelProps {
  onClose: () => void;
}

/**
 * 도형 추가와 색 바꾸기를 한 패널에서 한다.
 *
 * 색을 고르면 선택된 도형이 있으면 그 색을 바꾸고, 없으면 다음에 넣을 도형의 색이 된다.
 * 색 바꾸기를 따로 만들면 도형 하나 칠하려고 패널을 두 번 열어야 한다.
 */
export default function ShapePanel({ onClose }: ShapePanelProps) {
  const [color, setColor] = useState<string>(SHAPE_COLORS[0] ?? '#ffffff');
  const addedCount = useRef(0);

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const updateShapeLayer = useProjectStore((state) => state.updateShapeLayer);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);

  const handleColor = (next: string) => {
    setColor(next);
    if (selectedId) updateShapeLayer(selectedId, { fill: next });
  };

  const handleAdd = (shape: ShapeKind) => {
    if (!ratio) return;
    const size = getRatioSize(ratio);

    const layer = createShapeLayer({
      shape,
      fill: color,
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
      cascadeIndex: addedCount.current % CASCADE_CYCLE,
    });

    addLayers([layer]);
    select(layer.id);
    addedCount.current += 1;
  };

  return (
    <PanelSheet title="도형" onClose={onClose}>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        {SHAPE_COLORS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleColor(item)}
            aria-label={`도형 색 ${item}`}
            style={{ backgroundColor: item }}
            className={`h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
              item === color ? 'border-primary-container' : 'border-white/10'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 pt-2">
        {SHAPE_KINDS.map((item) => (
          <button
            key={item.kind}
            type="button"
            onClick={() => handleAdd(item.kind)}
            className="rounded-2xl bg-surface-high py-4 text-label-lg text-on-surface transition-transform active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </PanelSheet>
  );
}
