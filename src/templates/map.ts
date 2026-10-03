import type { TemplateRowItem, TemplateSpec } from './types';

/**
 * 지도 앱의 장소 카드.
 *
 * 다녀온 가게를 피드에 올릴 때 쓴다. 실제 지도를 그리지 않는 이유는 두 가지다.
 * 타일을 받아오려면 지도 API 키와 네트워크가 필요하고, 그 화면을 그대로 올리는 것은
 * 지도 서비스의 이용 약관에 걸린다. 우리가 만드는 것은 "그 느낌의 카드"다.
 */

/** 지도 앱의 파랑과 별의 금색은 변형이 바뀌어도 그대로여야 카드가 그 카드로 보인다. */
const BLUE = '#1a73e8';
const GOLD = '#f2b01e';

/** 별 다섯 개. 자리는 줄 계산이 잡으므로 생김새만 다섯 번 펼친다. */
const STARS: readonly TemplateRowItem[] = Array.from({ length: 5 }, (_, index) => ({
  kind: 'icon' as const,
  icon: 'star',
  size: 23,
  fill: GOLD,
  solid: true,
  // 별끼리는 거의 붙여 둔다. 평점 뒤에 오는 첫 별만 한 칸 띄운다
  gap: index === 0 ? 10 : 2,
}));

export const MAP_TEMPLATE: TemplateSpec = {
  id: 'map',
  label: '지도 카드',
  width: 600,
  height: 782,

  fields: [
    { id: 'place', label: '장소', value: '스꾸 카페', maxLength: 22 },
    { id: 'rating', label: '평점', value: '4.5', maxLength: 4 },
    { id: 'reviews', label: '리뷰 수', value: '(1,353)', maxLength: 10 },
    { id: 'walk', label: '걸리는 시간', value: '2분', maxLength: 10 },
    { id: 'status', label: '영업 상태', value: '영업 중', maxLength: 10 },
    { id: 'hours', label: '영업 시간', value: '· 오후 9:00에 영업 종료', maxLength: 22 },
  ],

  slots: [
    { id: 'photo1', label: '큰 사진' },
    { id: 'photo2', label: '작은 사진 위' },
    { id: 'photo3', label: '작은 사진 아래' },
  ],

  variants: [
    {
      id: 'white',
      label: '화이트',
      palette: {
        card: '#ffffff',
        ink: '#1f1f1f',
        inkMuted: '#5f6368',
        accent: '#188038',
        onAccent: '#ffffff',
        slot: '#dadce0',
        divider: '#e4e6e9',
        chip: '#e8f0fe',
        onChip: BLUE,
      },
    },
    {
      id: 'glass',
      label: '반투명',
      palette: {
        card: '#ffffffc4',
        ink: '#14161a',
        inkMuted: '#4d5259',
        accent: '#0f7b34',
        onAccent: '#ffffff',
        slot: '#c9ced6cc',
        divider: '#0000001f',
        chip: '#e8f0fed9',
        onChip: '#1668d6',
      },
    },
    {
      id: 'dark',
      label: '다크',
      palette: {
        card: '#202124',
        ink: '#e8eaed',
        inkMuted: '#9aa0a6',
        accent: '#81c995',
        onAccent: '#202124',
        slot: '#3c4043',
        divider: '#3c4043',
        chip: '#2b2c2f',
        onChip: '#8ab4f8',
      },
    },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: 600, height: 782, radius: 34, fill: 'card', shadow: 26 },
    // 잡아서 내리는 시트라는 신호. 이것 하나로 "앱 화면을 오려 붙였다"는 인상이 생긴다
    { kind: 'rect', x: 270, y: 16, width: 60, height: 7, radius: 4, fill: 'divider' },

    { kind: 'icon', icon: 'chevronDown', x: 26, y: 40, size: 30, fill: 'inkMuted' },
    { kind: 'icon', icon: 'share', x: 496, y: 42, size: 27, fill: 'inkMuted' },
    { kind: 'icon', icon: 'dots', x: 546, y: 42, size: 27, fill: 'inkMuted' },

    {
      kind: 'text',
      field: 'place',
      x: 28,
      y: 92,
      width: 544,
      size: 42,
      weight: 700,
      fill: 'ink',
    },

    /*
     * 평점 줄과 영업 줄은 좌표를 적지 않는다.
     * "4.5"가 "5"가 되고 "(1,353)"이 "(매우 만족)"이 되는 순간 다음 글과 겹치기 때문에,
     * 글자 폭을 재서 차례로 밀어 놓는다.
     */
    {
      kind: 'row',
      x: 28,
      y: 152,
      gap: 8,
      maxWidth: 544,
      items: [
        { kind: 'text', field: 'rating', size: 25, fill: 'inkMuted', gap: 0 },
        ...STARS,
        { kind: 'text', field: 'reviews', size: 25, fill: 'inkMuted', gap: 10 },
        { kind: 'text', text: '·', size: 25, fill: 'inkMuted', gap: 12 },
        { kind: 'icon', icon: 'walk', size: 28, fill: 'inkMuted', gap: 10 },
        { kind: 'text', field: 'walk', size: 25, fill: 'inkMuted', gap: 4 },
      ],
    },
    {
      kind: 'row',
      x: 28,
      y: 198,
      gap: 10,
      maxWidth: 544,
      items: [
        { kind: 'text', field: 'status', size: 25, weight: 600, fill: 'accent' },
        { kind: 'text', field: 'hours', size: 25, fill: 'inkMuted' },
      ],
    },

    // 길찾기 버튼만 색을 채운다. 나머지까지 채우면 어디를 누르라는 화면인지 사라진다
    // 한글 라벨은 영문보다 짧아서 세 버튼을 같은 폭으로 나누고 내용을 가운데에 모은다
    { kind: 'rect', x: 28, y: 240, width: 173, height: 66, radius: 33, fill: BLUE },
    { kind: 'icon', icon: 'navigate', x: 66, y: 256, size: 32, fill: '#ffffff', solid: true },
    { kind: 'text', text: '경로', x: 108, y: 259, size: 26, weight: 600, fill: '#ffffff' },

    { kind: 'rect', x: 213, y: 240, width: 173, height: 66, radius: 33, fill: 'chip' },
    { kind: 'icon', icon: 'navigate', x: 252, y: 257, size: 29, fill: 'onChip', solid: true },
    { kind: 'text', text: '시작', x: 292, y: 259, size: 26, weight: 600, fill: 'onChip' },

    { kind: 'rect', x: 398, y: 240, width: 174, height: 66, radius: 33, fill: 'chip' },
    { kind: 'icon', icon: 'phone', x: 437, y: 256, size: 29, fill: 'onChip' },
    { kind: 'text', text: '전화', x: 477, y: 259, size: 26, weight: 600, fill: 'onChip' },

    { kind: 'slot', slot: 'photo1', x: 28, y: 326, width: 340, height: 340, radius: 18 },
    { kind: 'slot', slot: 'photo2', x: 380, y: 326, width: 192, height: 164, radius: 18 },
    { kind: 'slot', slot: 'photo3', x: 380, y: 502, width: 192, height: 164, radius: 18 },

    { kind: 'text', text: '개요', x: 28, y: 706, size: 23, weight: 600, fill: BLUE },
    { kind: 'text', text: '메뉴', x: 136, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: '리뷰', x: 244, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: '사진', x: 352, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: '업데이트', x: 460, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'rect', x: 0, y: 754, width: 600, height: 2, fill: 'divider' },
    // 밑줄은 글자 폭에 맞춘다. 영문 시절 폭을 두면 짧은 한글 탭 아래로 선만 삐져나온다
    { kind: 'rect', x: 20, y: 750, width: 62, height: 6, radius: 3, fill: BLUE },
  ],
};
