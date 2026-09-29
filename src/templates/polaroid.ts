import type { TemplateSpec } from './types';

/**
 * 폴라로이드 한 장.
 *
 * 사진 레이어의 테두리(photoStyle의 polaroid)와 겹쳐 보이지만 쓰임이 다르다.
 * 그쪽은 이미 넣은 사진에 테두리를 두르는 것이고, 이 카드는 글과 날짜가 붙은 한 벌이다.
 * 손글씨 폰트를 쓰는 것도 이쪽뿐이다.
 */
export const POLAROID_TEMPLATE: TemplateSpec = {
  id: 'polaroid',
  label: '폴라로이드',
  width: 520,
  height: 620,

  fields: [
    { id: 'caption', label: '글', value: '좋았던 날', maxLength: 16 },
    { id: 'date', label: '날짜', value: '2026.09.12', maxLength: 14 },
  ],

  slots: [{ id: 'photo', label: '사진' }],

  variants: [
    {
      id: 'white',
      label: '화이트',
      palette: {
        card: '#ffffff',
        ink: '#2b2b2b',
        inkMuted: '#a0a0a6',
        accent: '#ff5376',
        onAccent: '#ffffff',
        slot: '#e3e3e8',
        divider: '#ededf1',
        chip: '#f3f3f6',
        onChip: '#2b2b2b',
      },
    },
    {
      id: 'cream',
      label: '크림',
      palette: {
        card: '#fbf6ea',
        ink: '#3a3227',
        inkMuted: '#b0a48c',
        accent: '#d98b4a',
        onAccent: '#ffffff',
        slot: '#e8dcc6',
        divider: '#eee5d4',
        chip: '#f3ecdd',
        onChip: '#3a3227',
      },
    },
    {
      id: 'black',
      label: '블랙',
      palette: {
        card: '#151515',
        ink: '#f0f0f0',
        inkMuted: '#7d7d83',
        accent: '#fae362',
        onAccent: '#211c00',
        slot: '#2a2a2a',
        divider: '#2f2f2f',
        chip: '#242424',
        onChip: '#f0f0f0',
      },
    },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: 520, height: 620, radius: 10, fill: 'card', shadow: 22 },
    // 아래 여백이 위보다 넓다. 폴라로이드의 인상은 이 비대칭에서 나온다
    { kind: 'slot', slot: 'photo', x: 30, y: 30, width: 460, height: 460, radius: 4 },
    {
      kind: 'text',
      field: 'caption',
      x: 30,
      y: 516,
      width: 460,
      size: 40,
      fill: 'ink',
      align: 'center',
      fontId: 'kkubulim',
    },
    {
      kind: 'text',
      field: 'date',
      x: 30,
      y: 570,
      width: 460,
      size: 22,
      fill: 'inkMuted',
      align: 'center',
    },
  ],
};
