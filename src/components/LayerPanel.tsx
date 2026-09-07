import PanelSheet from './PanelSheet';
import { describeLayer } from '@/layers/describe';
import { sortByZIndex } from '@/layers/order';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
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
        <p className="px-4 pb-4 text-xs text-ink-muted">아직 넣은 것이 없다</p>
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
                  className={`flex min-w-0 flex-1 items-baseline gap-2 rounded-lg px-3 py-2 text-left ${
                    active ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-text'
                  }`}
                >
                  <span className="shrink-0 text-xs">{kind}</span>
                  <span
                    className={`truncate text-[11px] ${active ? 'text-white/80' : 'text-ink-muted'}`}
                  >
                    {detail}
                  </span>
                </button>
                <OrderButton label="위" onClick={() => reorderLayer(layer.id, 'forward')} />
                <OrderButton label="아래" onClick={() => reorderLayer(layer.id, 'backward')} />
              </li>
            );
          })}
        </ul>
      )}
    </PanelSheet>
  );
}

function OrderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg bg-ink-bg px-2.5 py-2 text-[11px] text-ink-muted active:opacity-60"
    >
      {label}
    </button>
  );
}
