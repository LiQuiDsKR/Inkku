import { useState, type ReactNode } from 'react';
import ColorRow from './ColorRow';
import TabChip from './TabChip';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';
import { packAssetUrl, type AssetPack, type AssetPackItem } from '@/assets/assetPacks';
import type { AssetTab } from '@/assets/assetTabs';
import { useAssetPack } from '@/assets/useAssetPack';

export interface AssetPick {
  pack: AssetPack;
  item: AssetPackItem;
  placeAs: AssetTab['placeAs'];
}

interface AssetBrowserProps {
  tab: AssetTab;
  /** 요소 패널의 탭 줄. 고르는 줄들과 함께 위에 붙어 있어야 해서 받아서 그린다. */
  header: ReactNode;
  color: string;
  onColor: (color: string) => void;
  onPick: (pick: AssetPick) => void;
}

/**
 * 에셋 탭 하나. 그림체(출처)와 묶음을 고르고 그리드에서 붙일 것을 누른다.
 *
 * 한 묶음이 수백 개라 그림은 칸이 화면에 들어올 때 받는다(loading="lazy").
 * 목록을 한 번에 그려도 img 요소 수백 개는 폰에서 문제없지만, 그림 수백 장을 한꺼번에 받으면
 * 느린 망에서 앞쪽 칸까지 늦게 뜬다.
 */
export default function AssetBrowser({ tab, header, color, onColor, onPick }: AssetBrowserProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);

  const source = tab.sources[sourceIndex] ?? tab.sources[0];
  const { pack, failed, retry } = useAssetPack(source?.packId ?? '');

  const groups = pack
    ? pack.groups.filter((group) => !source?.groups || source.groups.includes(group.id))
    : [];
  const activeGroup = groups.find((group) => group.id === groupId) ?? groups[0] ?? null;
  const items = pack && activeGroup ? pack.items.filter((item) => item.group === activeGroup.id) : [];
  const isLine = tab.placeAs === 'line';

  const chooseSource = (index: number) => {
    setSourceIndex(index);
    // 그림체마다 묶음 구성이 다르다. 이전 묶음 id를 들고 가면 없는 묶음을 가리킨다
    setGroupId(null);
  };

  return (
    <>
      {/* 목록이 길어서 내려가도 고르는 줄은 위에 남아 있어야 한다 */}
      <div className="sticky top-0 z-10 bg-surface-container">
        {header}
        {tab.sources.length > 1 && (
          <div className="scroll-contain no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
            {tab.sources.map((item, index) => (
              <TabChip
                key={`${item.packId}-${item.label}`}
                label={item.label}
                active={index === sourceIndex}
                onClick={() => chooseSource(index)}
                small
              />
            ))}
          </div>
        )}
        {groups.length > 1 && (
          <div className="scroll-contain no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
            {groups.map((group) => (
              <TabChip
                key={group.id}
                label={group.label}
                active={group.id === activeGroup?.id}
                onClick={() => setGroupId(group.id)}
                small
              />
            ))}
          </div>
        )}
        {pack?.tintable && <ColorRow color={color} onColor={onColor} />}
      </div>

      {failed ? (
        <div className="flex flex-col items-center gap-2 p-6 text-body-md text-muted">
          목록을 받지 못했다.
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-surface-high px-4 py-2 text-label-lg text-on-surface"
          >
            다시 시도
          </button>
        </div>
      ) : !pack ? (
        <p className="p-6 text-center text-body-md text-muted">불러오는 중</p>
      ) : (
        <div className={`grid gap-2 p-4 pt-2 ${isLine ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {items.map((item) => (
            <AssetTile
              key={item.id}
              url={packAssetUrl(pack.id, item)}
              label={item.label}
              wide={isLine}
              tint={pack.tintable ? color : null}
              onClick={() => onPick({ pack, item, placeAs: tab.placeAs })}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface AssetTileProps {
  url: string;
  label: string;
  /** 꾸밈선은 가로로 길어서 정사각형 칸에 넣으면 실물이 거의 안 보인다. */
  wide: boolean;
  /** 색을 입히는 에셋이면 그 색. 칸에서도 고른 색으로 보여야 무엇이 붙을지 안다. */
  tint: string | null;
  onClick: () => void;
}

function AssetTile({ url, label, wide, tint, onClick }: AssetTileProps) {
  const shape = wide ? 'aspect-[4/1]' : 'aspect-square';

  if (tint) {
    // img에는 색을 입힐 수 없다. 그림을 가리개로 쓰고 바탕을 고른 색으로 칠하면 같은 모양이 된다
    const mask = {
      WebkitMaskImage: `url("${url}")`,
      maskImage: `url("${url}")`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      backgroundColor: tint,
    };
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center rounded-xl p-2 active:opacity-60 ${shape}`}
        style={{ background: VECTOR_TILE_BACKGROUND }}
      >
        <span className="h-full w-full" style={mask} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`asset-checker flex items-center justify-center rounded-xl p-2 active:opacity-60 ${shape}`}
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
      />
    </button>
  );
}
