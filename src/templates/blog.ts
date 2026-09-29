import type { TemplateSpec } from './types';

/**
 * 블로그 글머리 카드.
 *
 * 연도와 제목을 가운데 두고 그 아래 사진 두 장을 까는 배치는
 * 국내 블로그 글의 첫 화면에서 가장 흔한 형태다. 그날 쓴 글의 표지처럼 쓴다.
 */
export const BLOG_TEMPLATE: TemplateSpec = {
  id: 'blog',
  label: '블로그 카드',
  width: 600,
  height: 700,

  fields: [
    { id: 'year', label: '연도', value: '2026', maxLength: 8 },
    { id: 'title', label: '제목', value: '9월을 맞이하며', maxLength: 18 },
    { id: 'author', label: '이름', value: '스꾸', maxLength: 12 },
    { id: 'meta', label: '아래 설명', value: '방금 전 · 서로이웃', maxLength: 20 },
  ],

  slots: [
    { id: 'avatar', label: '프로필 사진' },
    { id: 'photo1', label: '왼쪽 사진' },
    { id: 'photo2', label: '오른쪽 사진' },
  ],

  variants: [
    {
      id: 'white',
      label: '화이트',
      palette: {
        card: '#ffffff',
        ink: '#1a1a1a',
        inkMuted: '#8b8b93',
        accent: '#03c75a',
        onAccent: '#ffffff',
        slot: '#e5e5ea',
        divider: '#ebebef',
        chip: '#f2f2f5',
        onChip: '#1a1a1a',
      },
    },
    {
      id: 'cream',
      label: '크림',
      palette: {
        card: '#f8f3e9',
        ink: '#2a2520',
        inkMuted: '#9a8f7d',
        accent: '#7a8b3f',
        onAccent: '#ffffff',
        slot: '#e6dccb',
        divider: '#e0d6c4',
        chip: '#efe7d8',
        onChip: '#2a2520',
      },
    },
    {
      id: 'dark',
      label: '다크',
      palette: {
        card: '#17171a',
        ink: '#f2f2f4',
        inkMuted: '#8e8e96',
        accent: '#03c75a',
        onAccent: '#0f0f11',
        slot: '#2a2a2f',
        divider: '#2a2a2f',
        chip: '#232328',
        onChip: '#f2f2f4',
      },
    },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: 600, height: 700, radius: 20, fill: 'card', shadow: 24 },

    {
      kind: 'text',
      field: 'year',
      x: 40,
      y: 54,
      width: 520,
      size: 24,
      weight: 700,
      fill: 'inkMuted',
      align: 'center',
    },
    {
      kind: 'text',
      field: 'title',
      x: 48,
      y: 92,
      width: 504,
      size: 48,
      weight: 700,
      fill: 'ink',
      align: 'center',
    },

    { kind: 'slot', slot: 'avatar', x: 270, y: 172, width: 60, height: 60, radius: 30 },

    {
      kind: 'text',
      field: 'author',
      x: 150,
      y: 250,
      width: 300,
      size: 26,
      weight: 600,
      fill: 'ink',
      align: 'center',
    },
    {
      kind: 'text',
      field: 'meta',
      x: 120,
      y: 288,
      width: 360,
      size: 21,
      fill: 'inkMuted',
      align: 'center',
    },

    { kind: 'rect', x: 48, y: 334, width: 504, height: 2, fill: 'divider' },

    // 사진 두 장을 맞붙여 깐다. 사이를 띄우면 표지가 아니라 앨범처럼 보인다
    { kind: 'slot', slot: 'photo1', x: 28, y: 362, width: 268, height: 306, radius: 10 },
    { kind: 'slot', slot: 'photo2', x: 304, y: 362, width: 268, height: 306, radius: 10 },
  ],
};
