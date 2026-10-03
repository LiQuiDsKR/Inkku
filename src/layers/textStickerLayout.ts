import { findFont } from '@/fonts/catalog';
import { fontSpec, measureTextWidth, type TextStyle } from '@/templates/measureText';
import { findPlate, type PlateBox } from './plateShapes';
import { STICKER_FONT_SIZE, STICKER_LINE_HEIGHT, type TextStickerStyle } from './textSticker';

/**
 * 문구 스티커의 배치 계산.
 *
 * 글자 폭을 재서 배경 도형의 크기를 정하고, 줄마다 놓을 자리를 정한다.
 * 캔버스 레이어와 패널 견본과 편집 화면이 전부 이 결과 하나로 그린다.
 * 각자 재면 견본의 도형과 실제 도형의 길이가 달라진다.
 *
 * 좌표의 원점은 글자 상자의 한가운데다. 레이어의 x, y가 곧 이 점이라 회전축이 글자 한가운데가 된다.
 */

/** 위아래 여백은 좌우의 이 비율만 준다. 줄 높이에 이미 위아래 빈 자리가 들어 있다. */
const VERTICAL_PAD = 0.7;

/**
 * 흐린 도형은 가장자리에서 안쪽으로도 옅어진다. 글자가 진한 한가운데에 남도록
 * 흐림 반경의 이 배수만큼 도형을 키운다. 키우지 않으면 흐릴수록 글자 끝이 바탕 밖으로 나간다.
 */
const SOFT_GROW = 1.1;

/** 흐림이 실제로 번져 나가는 범위(흐림 반경의 배수). 견본이 번진 자리까지 담아야 잘리지 않는다. */
const SOFT_REACH = 2;

export interface StickerLine {
  text: string;
  /** 줄의 세로 가운데 */
  y: number;
}

export interface StickerPlateLayout {
  path: string;
  box: PlateBox;
  color: string;
  opacity: number;
  /** 흐림 반경(논리 단위). 0이면 또렷하다. */
  sigma: number;
  border: { color: string; width: number } | null;
}

export interface TextStickerLayout {
  /** 캔버스 font 문자열. 잴 때 쓴 것과 같다. */
  font: string;
  family: string;
  weight: number;
  fontSize: number;
  lineHeight: number;
  lines: readonly StickerLine[];
  color: string;
  outline: { color: string; width: number } | null;
  plate: StickerPlateLayout | null;
  textBox: PlateBox;
  /** 선택 상자와 눌리는 영역. 흐림은 빼고 테두리는 넣는다. */
  bounds: PlateBox;
  /** 흐림이 번진 자리까지. 견본을 칸에 맞춰 넣을 때 쓴다. */
  visualBounds: PlateBox;
}

function inflate(box: PlateBox, by: number): PlateBox {
  return { x: box.x - by, y: box.y - by, width: box.width + by * 2, height: box.height + by * 2 };
}

function union(a: PlateBox, b: PlateBox): PlateBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

export function layoutTextSticker(text: string, style: TextStickerStyle): TextStickerLayout {
  const font = findFont(style.fontId);
  const size = STICKER_FONT_SIZE;
  const lineHeight = size * STICKER_LINE_HEIGHT;
  const measure: TextStyle = { size, family: font.family, weight: font.weight };

  // 자동 줄바꿈은 하지 않는다. 스티커는 줄을 사용자가 정하고, 긴 문구는 배율로 줄인다.
  const rawLines = text.split('\n');
  const width = rawLines.reduce((max, line) => Math.max(max, measureTextWidth(line, measure)), 0);
  const height = rawLines.length * lineHeight;
  const textBox: PlateBox = { x: -width / 2, y: -height / 2, width, height };
  const lines = rawLines.map((line, index) => ({
    text: line,
    y: -height / 2 + (index + 0.5) * lineHeight,
  }));

  const outline =
    style.outline && style.outline.width > 0
      ? { color: style.outline.color, width: style.outline.width * size }
      : null;

  // 테두리는 글자 윤곽 바깥으로 두께의 절반만큼 번진다. 선택 상자가 테두리를 자르면 안 된다.
  let bounds = inflate(textBox, (outline?.width ?? 0) / 2);
  let visualBounds = bounds;
  let plate: StickerPlateLayout | null = null;

  if (style.plate) {
    const def = findPlate(style.plate.shape);
    const sigma = Math.max(0, style.plate.soft) * size;
    const pad = style.plate.pad * size * def.padScale + sigma * SOFT_GROW;
    const geometry = def.build(width / 2 + pad, height / 2 + pad * VERTICAL_PAD, size);
    const border =
      style.plate.border && style.plate.border.width > 0
        ? { color: style.plate.border.color, width: style.plate.border.width * size }
        : null;

    plate = {
      path: geometry.path,
      box: geometry.box,
      color: style.plate.color,
      opacity: style.plate.opacity,
      sigma,
      border,
    };

    const edge = inflate(geometry.box, (border?.width ?? 0) / 2);
    bounds = union(bounds, edge);
    visualBounds = union(bounds, inflate(edge, sigma * SOFT_REACH));
  }

  return {
    font: fontSpec(measure),
    family: font.family,
    weight: font.weight,
    fontSize: size,
    lineHeight,
    lines,
    color: style.color,
    outline,
    plate,
    textBox,
    bounds,
    visualBounds,
  };
}
