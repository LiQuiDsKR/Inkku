import type { TextLayer } from './types';

/**
 * 텍스트 꾸미기의 기본값.
 *
 * 값을 컴포넌트에 흩어 두면 "새로 만든 글자"와 "고친 글자"의 기본이 달라진다.
 * 한 곳에 모아 두고 양쪽이 같은 값을 쓴다.
 */

/** 사진 위에서 눈에 띄는 색만 고른다. 색상환 전체를 주면 폰 화면에서 고르기만 오래 걸린다. */
export const TEXT_COLORS: readonly string[] = [
  '#ffffff',
  '#111113',
  '#ff5470',
  '#ff922b',
  '#ffd43b',
  '#69db7c',
  '#4dabf7',
  '#b197fc',
  '#ff6b9d',
  '#f8f0dd',
];

/** 논리 좌표 기준. 캔버스 긴 변이 1080이므로 40이면 작은 자막, 200이면 화면을 채우는 제목이다. */
export const MIN_FONT_SIZE = 40;
export const MAX_FONT_SIZE = 220;
export const FONT_SIZE_STEP = 2;

/**
 * 외곽선 두께는 글자 크기에 비례해야 한다.
 * 고정값으로 두면 작은 글씨에서는 획이 뭉개지고 큰 글씨에서는 테두리가 보이지 않는다.
 */
export const STROKE_RATIO = 0.09;

export function defaultTextStroke(fontSize: number): NonNullable<TextLayer['stroke']> {
  return { color: '#111113', width: Math.max(2, Math.round(fontSize * STROKE_RATIO)) };
}

/** 그림자도 같은 이유로 글자 크기를 따라간다. */
export function defaultTextShadow(fontSize: number): NonNullable<TextLayer['shadow']> {
  return {
    color: 'rgba(0, 0, 0, 0.45)',
    blur: Math.round(fontSize * 0.18),
    offsetX: Math.round(fontSize * 0.06),
    offsetY: Math.round(fontSize * 0.08),
  };
}
