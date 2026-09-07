import type { ShapeLayer } from './types';

/**
 * 도형의 기본 크기와 목록.
 *
 * 도형은 이미지가 없어서 크기의 기준이 필요하다. 스티커와 같은 256을 쓰면
 * 나란히 놓았을 때 눈에 보이는 크기가 비슷해진다.
 */
export const SHAPE_BASE_SIZE = 256;

/** 새 도형이 캔버스 가로폭에서 차지할 비율. 스티커와 같은 값이라 감각이 일관된다. */
export const SHAPE_FILL_RATIO = 0.32;

export type ShapeKind = ShapeLayer['shape'];

export const SHAPE_KINDS: readonly { kind: ShapeKind; label: string }[] = [
  { kind: 'rect', label: '사각형' },
  { kind: 'circle', label: '원' },
  { kind: 'triangle', label: '삼각형' },
  { kind: 'star', label: '별' },
  { kind: 'heart', label: '하트' },
  { kind: 'arrow', label: '화살표' },
];

/** 사진 위에서 잘 보이는 색만 고른다. 텍스트 팔레트와 같은 값을 써서 결과물의 색이 겉돌지 않게 한다. */
export const SHAPE_COLORS: readonly string[] = [
  '#ffffff',
  '#111113',
  '#ff5470',
  '#ff922b',
  '#ffd43b',
  '#69db7c',
  '#4dabf7',
  '#b197fc',
];

/**
 * 하트는 Konva 기본 도형에 없어서 경로로 그린다.
 * 좌표는 256 정사각형 기준이며, 중심을 원점으로 옮기는 일은 그리는 쪽에서 한다.
 */
export const HEART_PATH =
  'M128 220C128 220 24 156 24 92C24 56 52 32 84 32C104 32 120 42 128 58C136 42 152 32 172 32C204 32 232 56 232 92C232 156 128 220 128 220Z';
