import Icon from './icons/Icon';
import { MAX_MASK_ZOOM, MIN_MASK_ZOOM } from '@/layers/photoCrop';
import { useProjectStore } from '@/store/projectStore';
import { useToolStore } from '@/store/toolStore';
import type { PhotoLayer } from '@/layers/types';

/** 슬라이더 눈금 수. 배율 1~4를 100칸으로 나눈다. */
const STEPS = 100;

interface MaskAdjustBarProps {
  layer: PhotoLayer;
}

/**
 * 도형 안에서 사진을 맞추는 동안 뜨는 바.
 *
 * 손가락으로 끌어 옮기고 두 손가락으로 키우는 것이 주 조작이지만, 슬라이더도 같이 둔다.
 * 두 손가락 확대는 알려 주지 않으면 아무도 찾지 못하고, PC에서는 아예 할 수 없다.
 */
export default function MaskAdjustBar({ layer }: MaskAdjustBarProps) {
  const updatePhotoLayer = useProjectStore((state) => state.updatePhotoLayer);
  const closeMaskEdit = useToolStore((state) => state.closeMaskEdit);

  const zoom = layer.maskZoom ?? MIN_MASK_ZOOM;
  const percent = Math.round(
    ((zoom - MIN_MASK_ZOOM) / (MAX_MASK_ZOOM - MIN_MASK_ZOOM)) * STEPS,
  );

  const handleZoom = (value: number) => {
    const next = MIN_MASK_ZOOM + (value / STEPS) * (MAX_MASK_ZOOM - MIN_MASK_ZOOM);
    // 슬라이더를 끄는 동안은 기록하지 않는다. 매 프레임 남기면 실행취소가 슬라이더 한 번에 다 찬다.
    updatePhotoLayer(layer.id, { maskZoom: next }, false);
  };

  return (
    <div className="absolute inset-x-0 bottom-full z-40 px-3 pb-2">
      <div className="glass-panel flex flex-col gap-2 rounded-3xl px-3 py-2.5">
        <p className="text-label-md text-muted">
          끌어서 위치를 맞춘다. 두 손가락으로 크기를 바꾼다.
        </p>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-label-md text-tertiary">
            <Icon name="crop" size={14} />
            {zoom.toFixed(1)}배
          </span>
          <input
            type="range"
            min={0}
            max={STEPS}
            value={percent}
            aria-label="사진 크기"
            onChange={(event) => handleZoom(Number(event.currentTarget.value))}
            className="neo-slider flex-1"
          />
          <button
            type="button"
            onClick={() =>
              updatePhotoLayer(layer.id, { maskZoom: undefined, maskOffset: undefined })
            }
            className="shrink-0 rounded-full bg-surface-high px-3 py-1.5 text-label-md text-on-surface-variant transition-transform active:scale-95"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={closeMaskEdit}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary-container px-3 py-1.5 text-label-lg text-on-primary-container transition-transform active:scale-95"
          >
            완료
            <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
