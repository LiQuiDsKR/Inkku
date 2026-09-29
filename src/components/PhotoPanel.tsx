import FrameSwatch from './FrameSwatch';
import MaskSwatch from './MaskSwatch';
import PanelSheet from './PanelSheet';
import { FRAME_PRESETS, defaultBorder } from '@/layers/photoFrame';
import { FILTER_PRESETS, PHOTO_MASKS } from '@/layers/photoStyle';
import { useLayerById, useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

interface PhotoPanelProps {
  onClose: () => void;
}

/**
 * 선택된 사진의 보정과 테두리.
 *
 * 프리셋 썸네일은 실제 사진이 아니라 색 견본에 CSS 필터를 씌워 만든다.
 * 사진마다 썸네일을 다시 굽는 것은 폰에서 눈에 띄게 느리고, 프리셋의 성격은 견본으로도 충분히 보인다.
 */
export default function PhotoPanel({ onClose }: PhotoPanelProps) {
  const selectedId = useSelectionStore((state) => state.selectedId);
  const layer = useLayerById(selectedId);
  const updatePhotoLayer = useProjectStore((state) => state.updatePhotoLayer);

  const photo = layer && layer.type === 'photo' ? layer : null;
  const currentFilter = photo?.filter?.preset ?? 'none';
  const currentBorder = photo?.border?.style ?? 'none';

  return (
    <PanelSheet title="사진 편집" onClose={onClose}>
      {!photo ? (
        <p className="px-4 pb-4 text-body-md text-muted">사진을 먼저 고른다</p>
      ) : (
        <div className="px-4 pb-4">
          <p className="pb-2 text-label-md text-muted">모양</p>
          <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto pb-3">
            <MaskButton
              label="원본"
              active={!photo.mask}
              onClick={() => updatePhotoLayer(photo.id, { mask: undefined })}
            >
              {/* 자르지 않은 상태의 견본은 사진 그대로라는 뜻의 네모다 */}
              <span className="h-7 w-7 rounded-[3px] bg-current" />
            </MaskButton>

            {PHOTO_MASKS.map((item) => (
              <MaskButton
                key={item.mask}
                label={item.label}
                active={photo.mask === item.mask}
                onClick={() =>
                  updatePhotoLayer(photo.id, {
                    // 도형으로 자르면 테두리는 뜻이 없어진다. 같이 지운다.
                    mask: item.mask,
                    border: undefined,
                  })
                }
              >
                <MaskSwatch mask={item.mask} className="h-8 w-8" />
              </MaskButton>
            ))}
          </div>

          {/* 두 손가락 확대와 마찬가지로, 알려 주지 않으면 아무도 꾹 눌러 보지 않는다 */}
          {photo.mask && (
            <p className="pb-3 text-label-md text-tertiary">
              사진을 꾹 누르면 도형 안에서 위치와 크기를 맞출 수 있다
            </p>
          )}

          <p className="pb-2 text-label-md text-muted">보정</p>
          <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto pb-3">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  updatePhotoLayer(photo.id, { filter: { preset: preset.id, intensity: 1 } })
                }
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <span
                  className={`block h-14 w-14 rounded-2xl border-2 ${
                    preset.id === currentFilter ? 'border-primary-container' : 'border-white/10'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #f7b267, #4dabf7 60%, #2f5d8c)',
                    filter: preset.css,
                  }}
                />
                <span className="text-label-md text-muted">{preset.label}</span>
              </button>
            ))}
          </div>

          <p className="pb-2 text-label-md text-muted">프레임</p>
          {/* 도형으로 자른 사진에는 액자를 두를 수 없다. 하트 둘레의 네모난 종이는 액자로 안 보인다 */}
          {photo.mask ? (
            <p className="text-label-md text-muted">도형으로 자른 사진에는 프레임을 두르지 않는다</p>
          ) : (
            <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto">
              {FRAME_PRESETS.map((item) => (
                <MaskButton
                  key={item.style}
                  label={item.label}
                  active={item.style === currentBorder}
                  onClick={() =>
                    updatePhotoLayer(photo.id, {
                      // none은 속성을 지운다. 남겨 두면 저장 데이터에 의미 없는 값이 쌓인다.
                      border: item.style === 'none' ? undefined : defaultBorder(item.style),
                    })
                  }
                >
                  {item.style === 'none' ? (
                    <span className="h-7 w-7 rounded-[3px] bg-current" />
                  ) : (
                    <FrameSwatch style={item.style} className="h-11 w-11 rounded-[3px]" />
                  )}
                </MaskButton>
              ))}
            </div>
          )}
        </div>
      )}
    </PanelSheet>
  );
}

interface MaskButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MaskButton({ label, active, onClick, children }: MaskButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1 transition-transform active:scale-95"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${
          active
            ? 'border-primary-container bg-surface-high text-on-surface'
            : 'border-white/10 bg-surface-low text-on-surface-variant'
        }`}
      >
        {children}
      </span>
      <span className="text-label-md text-muted">{label}</span>
    </button>
  );
}
