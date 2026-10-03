/**
 * 요소 패널의 에셋 탭 구성.
 *
 * 탭은 쓰는 사람의 목적(말풍선을 붙이고 싶다)으로 나누고, 팩은 출처로 나뉜다.
 * 둘이 일대일이 아니라서(오픈클립아트 한 팩이 말풍선, 꾸밈, 꾸밈선에 흩어진다)
 * 탭이 어느 팩의 어느 묶음을 보여 줄지 여기서 이어 준다.
 *
 * 탭 하나에는 출처를 하나만 둔다. 그림체를 고르는 줄(플랫/노토/말랑)을 두면 탭 아래 칩 줄이
 * 두 겹이 되어 무엇을 고르는 줄인지 헷갈리고, 같은 그림이 세 벌이라 고를 것만 늘어난다.
 * 노토와 말랑 이모지, 오픈클립아트 손그림은 그래서 탭에서 뺐다. 팩 파일은 남겨 둔다.
 * 예전 작업물의 스티커가 그 주소를 그대로 가리킨다(`assetUrl`).
 */

export interface AssetSource {
  packId: string;
  /** 한 탭에 출처가 둘 이상이면 칩으로 고른다. 지금은 모든 탭이 하나라 칩 줄이 나오지 않는다. */
  label: string;
  /** 이 묶음만 보여 준다. 없으면 팩 전체. */
  groups?: readonly string[];
}

export interface AssetTab {
  id: string;
  label: string;
  /** 꾸밈선은 레이어 타입이 다르고 처음 놓이는 크기(가로로 길게)도 다르다. */
  placeAs: 'sticker' | 'line';
  sources: readonly AssetSource[];
  /** 문구 스티커 바로 뒤, 도형보다 앞에 선다. 가장 자주 붙일 것이라 앞자리를 준다. */
  lead?: boolean;
}

export const ASSET_TABS: readonly AssetTab[] = [
  {
    // 직접 고른 스티커. 분류 폴더가 묶음 칩이 된다(public/assets/stickers, 이름은 stickerCategories)
    id: 'sticker',
    label: '스티커',
    placeAs: 'sticker',
    lead: true,
    sources: [{ packId: 'sticker', label: '스티커' }],
  },
  {
    id: 'emoji',
    label: '이모지',
    placeAs: 'sticker',
    sources: [{ packId: 'fluent-flat', label: '플랫' }],
  },
  {
    id: 'bubble',
    label: '말풍선',
    placeAs: 'sticker',
    sources: [{ packId: 'openclipart', label: '말풍선', groups: ['bubble'] }],
  },
  {
    id: 'deco',
    label: '꾸밈',
    placeAs: 'sticker',
    sources: [
      {
        packId: 'openclipart',
        label: '꾸밈',
        groups: ['cute', 'heart', 'ribbon', 'crown', 'banner', 'frame', 'ornament'],
      },
    ],
  },
  {
    id: 'line',
    label: '꾸밈선',
    placeAs: 'line',
    sources: [{ packId: 'openclipart', label: '구분선', groups: ['line'] }],
  },
  {
    id: 'doodle',
    label: '손그림',
    placeAs: 'sticker',
    sources: [{ packId: 'doodle', label: '두들' }],
  },
  {
    id: 'weather',
    label: '날씨',
    placeAs: 'sticker',
    sources: [{ packId: 'meteocons', label: '날씨' }],
  },
];
