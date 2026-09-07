import PanelSheet from './PanelSheet';
import { BORDER_STYLES, FILTER_PRESETS, defaultBorder } from '@/layers/photoStyle';
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
    <PanelSheet title="사진 보정" onClose={onClose}>
      {!photo ? (
        <p className="px-4 pb-4 text-xs text-ink-muted">사진을 먼저 고른다</p>
      ) : (
        <div className="px-4 pb-4">
          <p className="pb-2 text-[11px] text-ink-muted">보정</p>
          <div className="scroll-contain flex gap-2 overflow-x-auto pb-3">
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
                  className={`block h-14 w-14 rounded-xl border-2 ${
                    preset.id === currentFilter ? 'border-ink-accent' : 'border-ink-line'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #f7b267, #4dabf7 60%, #2f5d8c)',
                    filter: preset.css,
                  }}
                />
                <span className="text-[11px] text-ink-muted">{preset.label}</span>
              </button>
            ))}
          </div>

          <p className="pb-2 text-[11px] text-ink-muted">테두리</p>
          <div className="flex gap-2">
            {BORDER_STYLES.map((item) => (
              <button
                key={item.style}
                type="button"
                onClick={() =>
                  updatePhotoLayer(photo.id, {
                    // none은 속성을 지운다. 남겨 두면 저장 데이터에 의미 없는 값이 쌓인다.
                    border: item.style === 'none' ? undefined : defaultBorder(item.style),
                  })
                }
                className={`flex-1 rounded-xl py-2 text-xs ${
                  item.style === currentBorder ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </PanelSheet>
  );
}
