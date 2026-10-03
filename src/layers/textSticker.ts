import { createId } from '@/utils/id';
import type { PlateShape } from './plateShapes';
import type { TextStickerLayer } from './types';

/**
 * 문구 스티커의 생김새.
 *
 * 프리셋 하나가 곧 이 값 한 벌이다. 글꼴까지 들어간다. 픽셀 네모칸은 픽셀 글꼴이어야 픽셀 네모칸이다.
 *
 * 두께와 여백과 흐림은 전부 글자 크기에 대한 비율로 둔다. 스티커는 배율로 키우고 줄이므로
 * 어느 크기에서도 같은 모양이어야 하고, 같은 프리셋이 문구 길이와 상관없이 같은 인상을 줘야 한다.
 */
export interface TextStickerStyle {
  /** 폰트 카탈로그의 id. 실제 family는 그릴 때 카탈로그에서 찾는다. */
  fontId: string;
  /** 글자색 */
  color: string;
  /** 글자 테두리. 없으면 테두리 없이 글자만 칠한다. */
  outline?: StrokeSpec;
  /** 글자 뒤의 도형. 없으면 글자만 있는 스티커다. */
  plate?: StickerPlate;
}

export interface StrokeSpec {
  color: string;
  /** 선 두께. 글자 크기 대비 비율이다. 글자 테두리는 바깥 절반만 보인다(채우기를 나중에 칠한다). */
  width: number;
}

export interface StickerPlate {
  shape: PlateShape;
  /** 배경색 */
  color: string;
  /** 진하기. 1보다 작으면 뒤가 비친다. */
  opacity: number;
  /** 부드러운 가장자리. 흐림 반경을 글자 크기 대비로 둔다. 0이면 또렷하다. */
  soft: number;
  /** 글자 둘레 여백. 글자 크기 대비. */
  pad: number;
  /** 도형 테두리 */
  border?: StrokeSpec;
}

/**
 * 스티커 안에서 글자를 그리는 크기(논리 단위).
 * 화면에서의 크기는 레이어 배율이 정한다. 다른 스티커처럼 손가락으로 키우고 줄이면
 * 테두리와 흐림까지 같은 비율로 따라와야 스티커답다.
 */
export const STICKER_FONT_SIZE = 100;

/** 줄 간격. 한글은 1.0이면 받침이 윗줄에 붙어 보인다. */
export const STICKER_LINE_HEIGHT = 1.25;

export interface StyleLevel {
  label: string;
  value: number;
}

/** 단계로만 고른다. 슬라이더는 폰에서 미세 조정이 어렵고, 단계면 프리셋과 값이 맞아떨어진다. */
export const OUTLINE_LEVELS: readonly StyleLevel[] = [
  { label: '없음', value: 0 },
  { label: '얇게', value: 0.08 },
  { label: '보통', value: 0.16 },
  { label: '굵게', value: 0.28 },
  { label: '아주 굵게', value: 0.42 },
];

export const BORDER_LEVELS: readonly StyleLevel[] = [
  { label: '없음', value: 0 },
  { label: '얇게', value: 0.035 },
  { label: '보통', value: 0.06 },
  { label: '굵게', value: 0.1 },
];

export const SOFT_LEVELS: readonly StyleLevel[] = [
  { label: '또렷', value: 0 },
  { label: '약간', value: 0.08 },
  { label: '보통', value: 0.18 },
  { label: '많이', value: 0.3 },
  { label: '아주 많이', value: 0.48 },
];

export const PAD_LEVELS: readonly StyleLevel[] = [
  { label: '좁게', value: 0.25 },
  { label: '보통', value: 0.45 },
  { label: '넓게', value: 0.7 },
  { label: '아주 넓게', value: 1 },
];

export const OPACITY_LEVELS: readonly StyleLevel[] = [
  { label: '연하게', value: 0.45 },
  { label: '보통', value: 0.75 },
  { label: '진하게', value: 1 },
];

/** 값에 가장 가까운 단계. 예전에 저장한 값이 단계 사이에 있어도 어느 칩이 켜질지 정해진다. */
export function nearestLevel(levels: readonly StyleLevel[], value: number): StyleLevel | undefined {
  return levels.reduce<StyleLevel | undefined>(
    (best, level) =>
      !best || Math.abs(level.value - value) < Math.abs(best.value - value) ? level : best,
    undefined,
  );
}

/** 글자와 테두리에 쓰는 또렷한 색. 첫 줄 */
export const STICKER_COLORS: readonly string[] = [
  '#ffffff',
  '#22242a',
  '#8c8f96',
  '#ff4d88',
  '#ff5470',
  '#ff922b',
  '#ffd43b',
  '#51cf66',
  '#12b886',
  '#4dabf7',
  '#4c6ef5',
  '#9775fa',
  '#8a5a44',
];

/** 감성 스티커의 바탕은 대개 파스텔이다. 둘째 줄로 따로 둬야 찾기 쉽다. */
export const STICKER_PASTELS: readonly string[] = [
  '#ffd6e7',
  '#ffc9c9',
  '#ffe8cc',
  '#fff3a8',
  '#d8f5a2',
  '#c3fae8',
  '#d0ebff',
  '#b8dcff',
  '#e5dbff',
  '#f8f0dd',
];

/** 도형 없이 쓰다가 처음 도형을 고를 때의 바탕. */
export const DEFAULT_PLATE: StickerPlate = {
  shape: 'round',
  color: '#ffffff',
  opacity: 1,
  soft: 0,
  pad: 0.45,
};

export const DEFAULT_OUTLINE_WIDTH = 0.16;
export const DEFAULT_BORDER_WIDTH = 0.06;

function sameStroke(a?: StrokeSpec, b?: StrokeSpec): boolean {
  if (!a || !b) return !a && !b;
  return a.color === b.color && a.width === b.width;
}

/** 지금 생김새가 어느 프리셋과 같은지 볼 때 쓴다. 객체를 만든 순서가 달라도 같다고 봐야 한다. */
export function sameStyle(a: TextStickerStyle, b: TextStickerStyle): boolean {
  if (a.fontId !== b.fontId || a.color !== b.color || !sameStroke(a.outline, b.outline)) return false;
  const p = a.plate;
  const q = b.plate;
  if (!p || !q) return !p && !q;
  return (
    p.shape === q.shape &&
    p.color === q.color &&
    p.opacity === q.opacity &&
    p.soft === q.soft &&
    p.pad === q.pad &&
    sameStroke(p.border, q.border)
  );
}

/** 새 스티커가 캔버스에서 차지할 최대 비율. 긴 문구는 이 폭에 맞춰 줄어든다. */
const FILL_WIDTH = 0.62;
const FILL_HEIGHT = 0.36;

/** 짧은 문구가 화면을 덮지 않게 하는 상한. 글자 크기 90(논리 단위)이면 일반 글자 도구와 비슷하다. */
const MAX_INITIAL_SCALE = 0.9;

export interface CreateTextStickerLayerParams {
  text: string;
  style: TextStickerStyle;
  /** 레이아웃에서 잰 스티커 크기(논리 단위). 처음 배율을 정하는 데만 쓴다. */
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  zIndex: number;
}

export function createTextStickerLayer(params: CreateTextStickerLayerParams): TextStickerLayer {
  const { text, style, width, height, canvasWidth, canvasHeight, zIndex } = params;
  const scale = Math.min(
    MAX_INITIAL_SCALE,
    (canvasWidth * FILL_WIDTH) / Math.max(1, width),
    (canvasHeight * FILL_HEIGHT) / Math.max(1, height),
  );

  return {
    id: createId(),
    type: 'textSticker',
    // 원점이 글자 한가운데다. 말풍선 꼬리처럼 한쪽으로 쏠린 도형이어도 글자가 캔버스 가운데에 온다.
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
    opacity: 1,
    zIndex,
    text,
    style,
  };
}
