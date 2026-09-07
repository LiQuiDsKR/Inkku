import { useRef, useState } from 'react';
import PanelSheet from './PanelSheet';
import { STICKER_CATEGORIES, type StickerAsset } from '@/assets/stickerCatalog';
import { createStickerLayer } from '@/layers/factory';
import { getRatioSize } from '@/layers/ratio';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

/** 같은 자리에 계속 쌓이지 않도록 어긋내는 최대 단계. 넘어가면 다시 0부터 돈다. */
const CASCADE_CYCLE = 5;

interface StickerPanelProps {
  onClose: () => void;
}

export default function StickerPanel({ onClose }: StickerPanelProps) {
  const [categoryId, setCategoryId] = useState(STICKER_CATEGORIES[0]?.id ?? '');
  // 몇 번째로 붙인 스티커인지 세는 값. 화면에 그릴 필요가 없어 상태 대신 ref로 둔다.
  const addedCount = useRef(0);

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const select = useSelectionStore((state) => state.select);

  const category =
    STICKER_CATEGORIES.find((item) => item.id === categoryId) ?? STICKER_CATEGORIES[0];

  const handlePick = (asset: StickerAsset) => {
    if (!ratio) return;
    const size = getRatioSize(ratio);

    const layer = createStickerLayer({
      assetId: asset.id,
      assetUrl: asset.url,
      naturalWidth: asset.width,
      naturalHeight: asset.height,
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
      cascadeIndex: addedCount.current % CASCADE_CYCLE,
    });

    addLayers([layer]);
    // 붙이자마자 선택해 두면 패널을 닫지 않고도 바로 옮길 수 있다
    select(layer.id);
    addedCount.current += 1;
  };

  return (
    <PanelSheet title="스티커" onClose={onClose}>
      <div className="scroll-contain flex gap-2 overflow-x-auto px-4 pb-2">
        {STICKER_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategoryId(item.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${
              item.id === category?.id ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 p-4 pt-2">
        {category?.items.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => handlePick(asset)}
            aria-label={asset.label}
            className="flex aspect-square items-center justify-center rounded-xl bg-ink-bg p-2 active:opacity-60"
          >
            {/* 목록은 원본 SVG를 그대로 쓴다. 썸네일을 따로 만들 만큼 무겁지 않다 */}
            <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
    </PanelSheet>
  );
}
