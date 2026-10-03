import type { PlateShape } from './plateShapes';
import {
  DEFAULT_BORDER_WIDTH,
  DEFAULT_OUTLINE_WIDTH,
  DEFAULT_PLATE,
  type StickerPlate,
  type TextStickerStyle,
} from './textSticker';

/**
 * 편집 화면의 조작을 생김새 값으로 옮기는 순수 함수.
 *
 * 화면 코드에 두지 않는 이유는 "없던 것을 켜는" 규칙이 여러 조작에 걸쳐 같아야 하기 때문이다.
 * 도형이 없는 스티커에서 배경색을 누르면 도형이 생기고, 테두리 두께를 누르면 테두리가 생겨야 한다.
 * 그 규칙이 버튼마다 흩어지면 어떤 버튼은 켜고 어떤 버튼은 무시하는 일이 생긴다.
 */

/** 색을 입힐 자리. 화면에서는 글자, 글자 테두리, 배경, 테두리로 부른다. */
export type ColorTarget = 'text' | 'outline' | 'plate' | 'border';

const INK = '#22242a';
const PAPER = '#ffffff';

/** 밝은 색인지. 테두리 기본색을 정할 때 쓴다. 흰 글자에 흰 테두리를 두르면 테두리가 안 보인다. */
function isLight(color: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match?.[1]) return true;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}

function contrastOf(color: string): string {
  return isLight(color) ? INK : PAPER;
}

/** 지금 그 자리에 칠해진 색. 꺼져 있으면 null이다(없음 표시를 그린다). */
export function colorOf(style: TextStickerStyle, target: ColorTarget): string | null {
  switch (target) {
    case 'text':
      return style.color;
    case 'outline':
      return style.outline?.color ?? null;
    case 'plate':
      return style.plate?.color ?? null;
    case 'border':
      return style.plate?.border?.color ?? null;
  }
}

/**
 * 도형을 손대야 하는데 도형이 없을 때 되살릴 도형.
 * 없음을 골랐다가 다시 도형을 고르면 전에 쓰던 색과 흐림이 돌아와야 한다.
 */
function plateOf(style: TextStickerStyle, fallback: StickerPlate | null): StickerPlate {
  return style.plate ?? fallback ?? DEFAULT_PLATE;
}

export function applyColor(
  style: TextStickerStyle,
  target: ColorTarget,
  color: string,
  fallback: StickerPlate | null,
): TextStickerStyle {
  switch (target) {
    case 'text':
      return { ...style, color };
    case 'outline':
      return { ...style, outline: { color, width: style.outline?.width ?? DEFAULT_OUTLINE_WIDTH } };
    case 'plate':
      return { ...style, plate: { ...plateOf(style, fallback), color } };
    case 'border': {
      const plate = plateOf(style, fallback);
      return {
        ...style,
        plate: { ...plate, border: { color, width: plate.border?.width ?? DEFAULT_BORDER_WIDTH } },
      };
    }
  }
}

/** 글자 테두리 두께. 0이면 지운다. 처음 켤 때는 글자와 대비되는 색으로 두른다. */
export function setOutlineWidth(style: TextStickerStyle, width: number): TextStickerStyle {
  if (width <= 0) {
    const { outline: _removed, ...rest } = style;
    return rest;
  }
  return { ...style, outline: { color: style.outline?.color ?? contrastOf(style.color), width } };
}

/** 도형 테두리 두께. 도형이 없으면 도형부터 만든다. */
export function setBorderWidth(
  style: TextStickerStyle,
  width: number,
  fallback: StickerPlate | null,
): TextStickerStyle {
  const plate = plateOf(style, fallback);
  if (width <= 0) {
    const { border: _removed, ...rest } = plate;
    return { ...style, plate: rest };
  }
  return {
    ...style,
    plate: { ...plate, border: { color: plate.border?.color ?? contrastOf(plate.color), width } },
  };
}

/** 도형 모양. null이면 도형을 걷어 낸다(걷어 낸 값은 부르는 쪽이 기억해 둔다). */
export function setPlateShape(
  style: TextStickerStyle,
  shape: PlateShape | null,
  fallback: StickerPlate | null,
): TextStickerStyle {
  if (!shape) {
    const { plate: _removed, ...rest } = style;
    return rest;
  }
  return { ...style, plate: { ...plateOf(style, fallback), shape } };
}

/** 진하기, 흐림, 여백. 도형이 없으면 도형부터 만든다. */
export function patchPlate(
  style: TextStickerStyle,
  patch: Partial<Pick<StickerPlate, 'opacity' | 'soft' | 'pad'>>,
  fallback: StickerPlate | null,
): TextStickerStyle {
  return { ...style, plate: { ...plateOf(style, fallback), ...patch } };
}
