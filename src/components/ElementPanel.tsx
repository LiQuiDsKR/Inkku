import { useRef, useState } from 'react';
import PanelSheet from './PanelSheet';
import ParticlePreview from './ParticlePreview';
import { LINE_CATEGORY_ID, STICKER_CATEGORIES, type StickerAsset } from '@/assets/stickerCatalog';
import { createPresetLineLayer, createShapeLayer, createStickerLayer } from '@/layers/factory';
import { PARTICLE_SHAPES, createParticleLayer, type ParticleKind } from '@/layers/particles';
import { getRatioSize } from '@/layers/ratio';
import { SHAPE_COLORS, SHAPE_KINDS, type ShapeKind } from '@/layers/shapeStyle';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

/** 같은 자리에 계속 쌓이지 않도록 어긋내는 최대 단계. 넘어가면 다시 0부터 돈다. */
const CASCADE_CYCLE = 5;

/** 도형과 파티클은 에셋이 아니라 벡터라 스티커 카탈로그에 없다. 칩 줄에서만 같은 줄에 선다. */
const SHAPE_TAB_ID = 'shape';
const PARTICLE_TAB_ID = 'particle';

interface ElementPanelProps {
  onClose: () => void;
}

/**
 * 스티커, 꾸밈선, 도형을 한 패널에서 고른다.
 *
 * 셋을 툴바에서 나누면 칸이 모자란다(하단 툴바는 여섯 칸이 한계다).
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
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);

  const category = STICKER_CATEGORIES.find((item) => item.id === tabId) ?? null;
  const isLine = tabId === LINE_CATEGORY_ID;

  /** 붙인 뒤의 뒷정리. 바로 선택해 두면 패널을 닫지 않고도 옮길 수 있다. */
  const settle = (id: string) => {
    select(id);
    addedCount.current += 1;
  };

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

    // 꾸밈선은 레이어 타입이 다르다. 지금은 그리기가 같지만, 나중에 양끝을 잡아 늘이는
    // 조작이 붙으면 타입이 갈라져 있어야 한다.
    const layer = isLine ? createPresetLineLayer(common) : createStickerLayer(common);
    addLayers([layer]);
    settle(layer.id);
  };

  const handleAddShape = (shape: ShapeKind) => {
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
    settle(layer.id);
  };

  const handleAddParticle = (kind: ParticleKind) => {
    if (!ratio) return;
    const size = getRatioSize(ratio);

    const layer = createParticleLayer({
      kind,
      color,
      canvasWidth: size.width,
      canvasHeight: size.height,
      zIndex: peekNextZIndex(),
    });

    addLayers([layer]);
    settle(layer.id);
  };

  /** 색을 고르면 골라 둔 도형이나 파티클의 색을 바꾸고, 없으면 다음에 넣을 색이 된다. */
  const handleColor = (next: string) => {
    setColor(next);
    if (!selectedId) return;
    updateShapeLayer(selectedId, { fill: next });
    updateParticleLayer(selectedId, { color: next });
  };

  return (
    <PanelSheet title="요소" onClose={onClose}>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        <TabChip label="도형" active={tabId === SHAPE_TAB_ID} onClick={() => setTabId(SHAPE_TAB_ID)} />
        <TabChip
          label="파티클"
          active={tabId === PARTICLE_TAB_ID}
          onClick={() => setTabId(PARTICLE_TAB_ID)}
        />
        {STICKER_CATEGORIES.map((item) => (
          <TabChip
            key={item.id}
            label={item.label}
            active={item.id === tabId}
            onClick={() => setTabId(item.id)}
          />
        ))}
      </div>

      {/* 색을 고르는 줄은 벡터 탭(도형, 파티클)에서만 쓸모가 있다. 에셋은 그림에 색이 박혀 있다 */}
      {(tabId === SHAPE_TAB_ID || tabId === PARTICLE_TAB_ID) && (
        <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {SHAPE_COLORS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleColor(item)}
              aria-label={`색 ${item}`}
              style={{ backgroundColor: item }}
              className={`h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
                item === color ? 'border-primary-container' : 'border-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {tabId === SHAPE_TAB_ID ? (
        <div className="grid grid-cols-3 gap-2 p-4 pt-2">
          {SHAPE_KINDS.map((item) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => handleAddShape(item.kind)}
              className="rounded-2xl bg-surface-high py-4 text-label-lg text-on-surface transition-transform active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : tabId === PARTICLE_TAB_ID ? (
        <div className="grid grid-cols-4 gap-2 p-4 pt-2">
          {PARTICLE_SHAPES.map((item) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => handleAddParticle(item.kind)}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            >
              {/*
                흩뿌린 모양을 그대로 보여 준다. 이름만으로는 밀도와 크기를 알 수 없다.
                바탕은 중간 회색이다. 파티클은 흰색으로 쓰는 일이 가장 많은데
                투명 체크무늬 위에 흰 조각을 올리면 아무것도 안 보인다.
              */}
              <span
                className="flex aspect-square w-full items-center justify-center rounded-xl p-1"
                style={{ background: 'linear-gradient(135deg, #6f6f78, #9a9aa4)' }}
              >
                <ParticlePreview shape={item} color={color} className="h-full w-full" />
              </span>
              <span className="text-label-md text-muted">{item.label}</span>
            </button>
          ))}
        </div>
      ) : (
        /* 꾸밈선은 가로로 길어서 정사각형 칸에 넣으면 실물이 거의 안 보인다. 칸을 넓게 준다 */
        <div className={`grid gap-2 p-4 pt-2 ${isLine ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {category?.items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => handlePick(asset)}
              aria-label={asset.label}
              className={`asset-checker flex items-center justify-center rounded-xl p-2 active:opacity-60 ${
                isLine ? 'aspect-[4/1]' : 'aspect-square'
              }`}
            >
              {/* 목록은 원본 SVG를 그대로 쓴다. 썸네일을 따로 만들 만큼 무겁지 않다 */}
              <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </PanelSheet>
  );
}

interface TabChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabChip({ label, active, onClick }: TabChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-label-lg transition-colors ${
        active ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-high text-muted'
      }`}
    >
      {label}
    </button>
  );
}
