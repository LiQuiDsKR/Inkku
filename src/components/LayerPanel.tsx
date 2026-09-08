import Icon from './icons/Icon';
import PanelSheet from './PanelSheet';
import { describeLayer } from '@/layers/describe';
import { sortByZIndex } from '@/layers/order';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { IconName } from './icons/paths';
import type { Layer } from '@/layers/types';

interface LayerPanelProps {
  onClose: () => void;
}

/**
 * 레이어 목록.
 *
 * 캔버스에서는 위에 있는 레이어가 아래를 가린다. 특히 스티커와 낙서는 투명한 부분까지 눌려서
 * 밑에 깔린 사진을 손가락으로 고르기가 어렵다. 목록이 그 유일한 탈출구다.
 */
export default function LayerPanel({ onClose }: LayerPanelProps) {
  const layers = useProjectStore((state) => state.project?.layers);
  const reorderLayer = useProjectStore((state) => state.reorderLayer);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);

  // 화면에서 위에 보이는 것이 목록에서도 위에 오도록 뒤집는다
  const ordered: Layer[] = layers ? sortByZIndex(layers).reverse() : [];

  return (
    <PanelSheet title="레이어" onClose={onClose}>
      {ordered.length === 0 ? (
        <p className="px-4 pb-4 text-body-md text-muted">아직 넣은 것이 없다</p>
      ) : (
        <ul className="flex flex-col gap-1 px-4 pb-4">
          {ordered.map((layer) => {
            const { kind, detail } = describeLayer(layer);
            const active = layer.id === selectedId;
            return (
              <li key={layer.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => select(layer.id)}
                  className={`flex min-w-0 flex-1 items-baseline gap-2 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-l-4 border-secondary bg-surface-bright text-on-surface'
                      : 'bg-surface-high text-on-surface-variant'
                  }`}
                >
                  <span className="shrink-0 text-label-lg">{kind}</span>
                  <span className={`truncate text-label-md ${active ? 'text-primary' : 'text-muted'}`}>
                    {detail}
                  </span>
                </button>
                <OrderButton icon="up" label="한 칸 위로" onClick={() => reorderLayer(layer.id, 'forward')} />
                <OrderButton
                  icon="down"
                  label="한 칸 아래로"
                  onClick={() => reorderLayer(layer.id, 'backward')}
                />
              </li>
            );
          })}
        </ul>
      )}
    </PanelSheet>
  );
}

interface OrderButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
}

function OrderButton({ icon, label, onClick }: OrderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-transform active:scale-90"
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
