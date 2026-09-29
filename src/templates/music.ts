import type { TemplateSpec } from './types';

/**
 * 음악 재생 화면 카드.
 *
 * 블러 변형은 앨범 사진을 카드 뒤에 흐리게 깔고 그 위에 반투명 면을 덮는다.
 * 실제 음악 앱이 쓰는 방식이고, 사진 한 장만 넣으면 색이 저절로 맞아서 가장 손이 적게 간다.
 */
export const MUSIC_TEMPLATE: TemplateSpec = {
  id: 'music',
  label: '뮤직 플레이어',
  width: 560,
  height: 800,

  fields: [
    { id: 'title', label: '제목', value: 'Repeat', maxLength: 20 },
    { id: 'elapsed', label: '지난 시간', value: '00:36', maxLength: 6 },
    { id: 'total', label: '전체 길이', value: '05:39', maxLength: 6 },
  ],

  slots: [{ id: 'cover', label: '앨범 사진' }],

  variants: [
    {
      id: 'blur',
      label: '블러',
      // 카드 색을 반투명으로 두어야 뒤에 깔린 사진이 비쳐 보인다
      palette: {
        card: '#1e1e2499',
        ink: '#ffffff',
        inkMuted: '#ffffffb3',
        accent: '#ffffff',
        onAccent: '#1e1e24',
        slot: '#ffffff26',
        divider: '#ffffff4d',
        chip: '#ffffff33',
        onChip: '#ffffff',
      },
      blurSlot: 'cover',
    },
    {
      id: 'white',
      label: '화이트',
      palette: {
        card: '#f5f5f7',
        ink: '#1c1c1e',
        inkMuted: '#8e8e93',
        accent: '#1c1c1e',
        onAccent: '#ffffff',
        slot: '#dcdce1',
        divider: '#d5d5da',
        // 밝은 배경에서는 재생 버튼의 원을 빼고 아이콘만 둔다. 원까지 있으면 화면이 무거워진다
        chip: '#00000000',
        onChip: '#1c1c1e',
      },
    },
    {
      id: 'black',
      label: '블랙',
      palette: {
        card: '#1c1c1e',
        ink: '#f5f5f7',
        inkMuted: '#8e8e93',
        accent: '#f5f5f7',
        onAccent: '#1c1c1e',
        slot: '#2c2c2e',
        divider: '#3a3a3c',
        chip: '#3a3a3e',
        onChip: '#f5f5f7',
      },
    },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: 560, height: 800, radius: 40, fill: 'card', shadow: 30 },

    { kind: 'icon', icon: 'note', x: 30, y: 34, size: 34, fill: 'inkMuted' },
    {
      kind: 'text',
      field: 'title',
      x: 120,
      y: 42,
      width: 320,
      size: 26,
      weight: 600,
      fill: 'ink',
      align: 'center',
    },
    { kind: 'icon', icon: 'dots', x: 496, y: 36, size: 30, fill: 'inkMuted' },

    { kind: 'slot', slot: 'cover', x: 56, y: 112, width: 448, height: 448, radius: 26 },

    { kind: 'rect', x: 56, y: 616, width: 448, height: 6, radius: 3, fill: 'divider' },
    { kind: 'rect', x: 56, y: 616, width: 90, height: 6, radius: 3, fill: 'ink' },
    { kind: 'rect', x: 136, y: 608, width: 20, height: 20, radius: 10, fill: 'ink' },

    { kind: 'text', field: 'elapsed', x: 56, y: 642, size: 21, fill: 'inkMuted' },
    {
      kind: 'text',
      field: 'total',
      x: 384,
      y: 642,
      width: 120,
      size: 21,
      fill: 'inkMuted',
      align: 'right',
    },

    { kind: 'icon', icon: 'prev', x: 150, y: 696, size: 44, fill: 'ink', solid: true },
    { kind: 'rect', x: 236, y: 674, width: 88, height: 88, radius: 44, fill: 'chip' },
    { kind: 'icon', icon: 'pause', x: 258, y: 696, size: 44, fill: 'onChip', solid: true },
    { kind: 'icon', icon: 'next', x: 366, y: 696, size: 44, fill: 'ink', solid: true },

    { kind: 'rect', x: 200, y: 774, width: 160, height: 8, radius: 4, fill: 'divider' },
  ],
};
