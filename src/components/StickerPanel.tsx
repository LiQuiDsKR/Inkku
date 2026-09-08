import { useRef, useState } from 'react';
import PanelSheet from './PanelSheet';
import { LINE_CATEGORY_ID, STICKER_CATEGORIES, type StickerAsset } from '@/assets/stickerCatalog';
import { createPresetLineLayer, createStickerLayer } from '@/layers/factory';
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

    const common = {
      assetId: asset.id,
      assetUrl: asset.url,
      naturalWidth: asset.width,
      naturalHeight: asset.height,
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
      cascadeIndex: addedCount.current % CASCADE_CYCLE,
    };

    // 꾸밈선은 레이어 타입이 다르다. 지금은 그리기가 같지만, 나중에 선만 늘리거나
    // 양끝을 잡아 늘이는 조작이 붙으면 타입이 갈라져 있어야 한다.
    const layer =
      category?.id === LINE_CATEGORY_ID
        ? createPresetLineLayer(common)
        : createStickerLayer(common);

    addLayers([layer]);
    // 붙이자마자 선택해 두면 패널을 닫지 않고도 바로 옮길 수 있다
    select(layer.id);
    addedCount.current += 1;
  };

  return (
    <PanelSheet title="스티커와 꾸밈선" onClose={onClose}>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        {STICKER_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategoryId(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-label-lg transition-colors ${
              item.id === category?.id
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-surface-high text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 꾸밈선은 가로로 길어서 정사각형 칸에 넣으면 실물이 거의 안 보인다. 칸을 넓게 준다 */}
      <div
        className={`grid gap-2 p-4 pt-2 ${
          category?.id === LINE_CATEGORY_ID ? 'grid-cols-2' : 'grid-cols-4'
        }`}
      >
        {category?.items.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => handlePick(asset)}
            aria-label={asset.label}
            className={`asset-checker flex items-center justify-center rounded-xl p-2 active:opacity-60 ${
              category?.id === LINE_CATEGORY_ID ? 'aspect-[4/1]' : 'aspect-square'
            }`}
          >
            {/* 목록은 원본 SVG를 그대로 쓴다. 썸네일을 따로 만들 만큼 무겁지 않다 */}
            <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
    </PanelSheet>
  );
}
