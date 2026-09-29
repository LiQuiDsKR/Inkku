import { useRef, useState } from 'react';
import AssetBrowser, { type AssetPick } from './AssetBrowser';
import ColorRow from './ColorRow';
import PanelSheet from './PanelSheet';
import ParticleGrid from './ParticleGrid';
import ShapeGrid from './ShapeGrid';
import TabChip from './TabChip';
import { packAssetUrl } from '@/assets/assetPacks';
import { ASSET_TABS } from '@/assets/assetTabs';
import { createPresetLineLayer, createShapeLayer, createStickerLayer } from '@/layers/factory';
import type { ParticleKind } from '@/layers/particleCatalog';
import { createParticleLayer } from '@/layers/particles';
import { getRatioSize } from '@/layers/ratio';
import type { ShapeKind } from '@/layers/shapeCatalog';
import { SHAPE_COLORS } from '@/layers/shapeStyle';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

/** 같은 자리에 계속 쌓이지 않도록 어긋내는 최대 단계. 넘어가면 다시 0부터 돈다. */
const CASCADE_CYCLE = 5;

/** 도형과 파티클은 에셋이 아니라 벡터라 에셋 탭 목록에 없다. 칩 줄에서만 같은 줄에 선다. */
const SHAPE_TAB_ID = 'shape';
const PARTICLE_TAB_ID = 'particle';

interface ElementPanelProps {
  onClose: () => void;
}

/**
 * 도형, 파티클, 이모지, 말풍선, 꾸밈, 꾸밈선, 낙서를 한 패널에서 고른다.
 *
 * 툴바에서 나누면 칸이 모자란다(하단 툴바는 여섯 칸이 한계다).
 * 쓰는 사람 입장에서도 "붙일 것"이라는 하나의 목적이라, 고르는 곳이 나뉠 이유가 없다.
 */
export default function ElementPanel({ onClose }: ElementPanelProps) {
  const [tabId, setTabId] = useState(SHAPE_TAB_ID);
  const [color, setColor] = useState<string>(SHAPE_COLORS[0] ?? '#ffffff');
  // 몇 번째로 붙였는지 세는 값. 화면에 그릴 필요가 없어 상태 대신 ref로 둔다.
  const addedCount = useRef(0);

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const updateShapeLayer = useProjectStore((state) => state.updateShapeLayer);
  const updateParticleLayer = useProjectStore((state) => state.updateParticleLayer);
  const setAssetTint = useProjectStore((state) => state.setAssetTint);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);

  const assetTab = ASSET_TABS.find((item) => item.id === tabId) ?? null;

  /** 붙인 뒤의 뒷정리. 바로 선택해 두면 패널을 닫지 않고도 옮길 수 있다. */
  const settle = (id: string) => {
    select(id);
    addedCount.current += 1;
  };

  /** 새 요소를 놓을 자리와 순서. 모든 요소가 같은 규칙으로 놓인다. */
  const placement = () => {
    if (!ratio) return null;
    const size = getRatioSize(ratio);
    return {
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
      cascadeIndex: addedCount.current % CASCADE_CYCLE,
    };
  };

  const handlePickAsset = ({ pack, item, placeAs }: AssetPick) => {
    const place = placement();
    if (!place) return;

    const params = {
      ...place,
      // 팩 이름을 앞에 붙인다. 다른 팩에 같은 이름의 그림이 있다(noto와 fluent의 heart)
      assetId: `${pack.id}/${item.id}`,
      assetUrl: packAssetUrl(pack.id, item.id),
      naturalWidth: item.width,
      naturalHeight: item.height,
      tint: pack.tintable ? color : undefined,
    };

    // 꾸밈선은 레이어 타입이 다르다. 지금은 그리기가 같지만, 나중에 양끝을 잡아 늘이는
    // 조작이 붙으면 타입이 갈라져 있어야 한다.
    const layer = placeAs === 'line' ? createPresetLineLayer(params) : createStickerLayer(params);
    addLayers([layer]);
    settle(layer.id);
  };

  const handleAddShape = (shape: ShapeKind) => {
    const place = placement();
    if (!place) return;
    const layer = createShapeLayer({ ...place, shape, fill: color });
    addLayers([layer]);
    settle(layer.id);
  };

  const handleAddParticle = (kind: ParticleKind) => {
    const place = placement();
    if (!place) return;
    const layer = createParticleLayer({ ...place, kind, color });
    addLayers([layer]);
    settle(layer.id);
  };

  /**
   * 색을 고르면 골라 둔 요소의 색을 바꾸고, 없으면 다음에 넣을 색이 된다.
   * 어떤 타입인지 따지지 않고 셋 다 부른다. 타입이 맞지 않는 쪽은 아무 일도 하지 않는다.
   */
  const handleColor = (next: string) => {
    setColor(next);
    if (!selectedId) return;
    updateShapeLayer(selectedId, { fill: next });
    updateParticleLayer(selectedId, { color: next });
    setAssetTint(selectedId, next);
  };

  const tabRow = (
    <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
      <TabChip label="도형" active={tabId === SHAPE_TAB_ID} onClick={() => setTabId(SHAPE_TAB_ID)} />
      <TabChip
        label="파티클"
        active={tabId === PARTICLE_TAB_ID}
        onClick={() => setTabId(PARTICLE_TAB_ID)}
      />
      {ASSET_TABS.map((item) => (
        <TabChip
          key={item.id}
          label={item.label}
          active={item.id === tabId}
          onClick={() => setTabId(item.id)}
        />
      ))}
    </div>
  );

  return (
    <PanelSheet title="요소" onClose={onClose}>
      {assetTab ? (
        // 탭마다 그림체와 묶음 선택이 따로다. key로 새로 마운트해 이전 탭의 선택을 끌고 오지 않는다
        <AssetBrowser
          key={assetTab.id}
          tab={assetTab}
          header={tabRow}
          color={color}
          onColor={handleColor}
          onPick={handlePickAsset}
        />
      ) : (
        <>
          <div className="sticky top-0 z-10 bg-surface-container">
            {tabRow}
            <ColorRow color={color} onColor={handleColor} />
          </div>
          {tabId === SHAPE_TAB_ID ? (
            <ShapeGrid color={color} onPick={handleAddShape} />
          ) : (
            <ParticleGrid color={color} onPick={handleAddParticle} />
          )}
        </>
      )}
    </PanelSheet>
  );
}
