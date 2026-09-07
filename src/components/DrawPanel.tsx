import PanelSheet from './PanelSheet';
import { SHAPE_COLORS } from '@/layers/shapeStyle';
import { useToolStore } from '@/store/toolStore';

/** 논리 좌표 기준 붓 두께 범위. 4는 가는 펜, 64는 형광펜에 가깝다. */
const MIN_WIDTH = 4;
const MAX_WIDTH = 64;

interface DrawPanelProps {
  onClose: () => void;
}

export default function DrawPanel({ onClose }: DrawPanelProps) {
  const brush = useToolStore((state) => state.brush);
  const setBrush = useToolStore((state) => state.setBrush);

  return (
    <PanelSheet title="그리기" onClose={onClose}>
      <div className="scroll-contain flex gap-2 overflow-x-auto px-4 pb-2">
        {SHAPE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setBrush({ color })}
            aria-label={`붓 색 ${color}`}
            style={{ backgroundColor: color }}
            className={`h-9 w-9 shrink-0 rounded-full border-2 ${
              color === brush.color ? 'border-ink-accent' : 'border-ink-line'
            }`}
          />
        ))}
      </div>

      <div className="px-4 pb-4">
        <label className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span className="w-8 shrink-0">굵기</span>
          <input
            type="range"
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            value={brush.width}
            onChange={(event) => setBrush({ width: Number(event.currentTarget.value) })}
            className="h-9 flex-1 accent-[var(--color-ink-accent)]"
          />
          <span className="w-6 shrink-0 text-right tabular-nums">{brush.width}</span>
        </label>

        {/* 실제 두께를 눈으로 확인할 수 있어야 한다. 숫자만으로는 감이 오지 않는다 */}
        <div className="mt-2 flex h-12 items-center justify-center rounded-xl bg-ink-bg">
          <span
            className="block rounded-full"
            style={{
              backgroundColor: brush.color,
              // 캔버스는 화면보다 크게 축소되어 그려지므로 미리보기도 같은 비율로 줄인다
              height: Math.max(2, brush.width * 0.35),
              width: '60%',
            }}
          />
        </div>

        <p className="mt-3 text-[11px] text-ink-muted">
          획 하나가 레이어 하나가 된다. 손을 떼면 이미지로 굳는다.
        </p>
      </div>
    </PanelSheet>
  );
}
