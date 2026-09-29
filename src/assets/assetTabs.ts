/**
 * 요소 패널의 에셋 탭 구성.
 *
 * 탭은 쓰는 사람의 목적(말풍선을 붙이고 싶다)으로 나누고, 팩은 출처로 나뉜다.
 * 둘이 일대일이 아니라서(오픈클립아트 한 팩이 말풍선, 꾸밈, 꾸밈선, 낙서에 흩어진다)
 * 탭이 어느 팩의 어느 묶음을 보여 줄지 여기서 이어 준다.
 */

export interface AssetSource {
  packId: string;
  /** 한 탭에 출처가 둘 이상이면 칩으로 고른다. 이모지의 그림체 고르기가 그렇다. */
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
}

export const ASSET_TABS: readonly AssetTab[] = [
  {
    id: 'emoji',
    label: '이모지',
    placeAs: 'sticker',
    sources: [
      { packId: 'fluent-flat', label: '플랫' },
      { packId: 'noto', label: '노토' },
      { packId: 'noto-blob', label: '말랑' },
    ],
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
    label: '낙서',
    placeAs: 'sticker',
    sources: [
      { packId: 'doodle', label: '두들' },
      { packId: 'openclipart', label: '손그림', groups: ['scribble'] },
    ],
  },
  {
    id: 'weather',
    label: '날씨',
    placeAs: 'sticker',
    sources: [{ packId: 'meteocons', label: '날씨' }],
  },
];
