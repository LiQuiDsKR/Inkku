import type { TemplateSpec, TemplatePart } from './types';

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

/** 별 다섯 개. 좌표만 다른 파트라 코드로 펼친다. 데이터에 같은 줄을 다섯 번 쓰지 않는다. */
const STARS: readonly TemplatePart[] = Array.from({ length: 5 }, (_, index) => ({
  kind: 'icon' as const,
  icon: 'star',
  x: 74 + index * 25,
  y: 154,
  size: 23,
  fill: GOLD,
  solid: true,
}));

export const MAP_TEMPLATE: TemplateSpec = {
  id: 'map',
  label: '지도 카드',
  width: 600,
  height: 782,

  fields: [
    { id: 'place', label: '장소', value: 'Seukku Cafe', maxLength: 22 },
    { id: 'rating', label: '평점', value: '4.5', maxLength: 4 },
    { id: 'reviews', label: '리뷰 수', value: '(1,353)', maxLength: 10 },
    { id: 'walk', label: '걸리는 시간', value: '2 min', maxLength: 10 },
    { id: 'status', label: '영업 상태', value: 'Open', maxLength: 10 },
    { id: 'hours', label: '영업 시간', value: '· Closes 21:00', maxLength: 22 },
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

    { kind: 'text', field: 'rating', x: 28, y: 156, size: 25, fill: 'inkMuted' },
    ...STARS,
    { kind: 'text', field: 'reviews', x: 206, y: 156, size: 25, fill: 'inkMuted' },
    { kind: 'icon', icon: 'walk', x: 306, y: 152, size: 28, fill: 'inkMuted' },
    { kind: 'text', field: 'walk', x: 338, y: 156, size: 25, fill: 'inkMuted' },

    { kind: 'text', field: 'status', x: 28, y: 198, size: 25, weight: 600, fill: 'accent' },
    { kind: 'text', field: 'hours', x: 118, y: 198, width: 440, size: 25, fill: 'inkMuted' },

    // 길찾기 버튼만 색을 채운다. 나머지까지 채우면 어디를 누르라는 화면인지 사라진다
    { kind: 'rect', x: 28, y: 240, width: 204, height: 66, radius: 33, fill: BLUE },
    { kind: 'icon', icon: 'navigate', x: 52, y: 256, size: 32, fill: '#ffffff', solid: true },
    {
      kind: 'text',
      text: 'Directions',
      x: 94,
      y: 259,
      size: 26,
      weight: 600,
      fill: '#ffffff',
    },

    { kind: 'rect', x: 244, y: 240, width: 152, height: 66, radius: 33, fill: 'chip' },
    { kind: 'icon', icon: 'navigate', x: 266, y: 257, size: 29, fill: 'onChip', solid: true },
    { kind: 'text', text: 'Start', x: 302, y: 259, size: 26, weight: 600, fill: 'onChip' },

    { kind: 'rect', x: 408, y: 240, width: 164, height: 66, radius: 33, fill: 'chip' },
    { kind: 'icon', icon: 'phone', x: 430, y: 256, size: 29, fill: 'onChip' },
    { kind: 'text', text: 'Call', x: 468, y: 259, size: 26, weight: 600, fill: 'onChip' },

    { kind: 'slot', slot: 'photo1', x: 28, y: 326, width: 340, height: 340, radius: 18 },
    { kind: 'slot', slot: 'photo2', x: 380, y: 326, width: 192, height: 164, radius: 18 },
    { kind: 'slot', slot: 'photo3', x: 380, y: 502, width: 192, height: 164, radius: 18 },

    { kind: 'text', text: 'Overview', x: 28, y: 706, size: 23, weight: 600, fill: BLUE },
    { kind: 'text', text: 'Menu', x: 172, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: 'Reviews', x: 268, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: 'Photos', x: 394, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'text', text: 'Updates', x: 500, y: 706, size: 23, fill: 'inkMuted' },
    { kind: 'rect', x: 0, y: 754, width: 600, height: 2, fill: 'divider' },
    { kind: 'rect', x: 28, y: 750, width: 112, height: 6, radius: 3, fill: BLUE },
  ],
};
