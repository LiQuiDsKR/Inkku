import { fillSoftShape } from './softShape';
import type { StickerPlateLayout, TextStickerLayout } from '@/layers/textStickerLayout';

/**
 * 문구 스티커 그리기.
 *
 * Konva 노드가 아니라 2D 컨텍스트에 바로 그린다. 같은 함수를 캔버스 레이어(Konva Shape)와
 * 패널 견본(<canvas>)과 편집 화면이 함께 부른다. 견본을 SVG로 따로 그리면 흐림의 세기와
 * 글자 테두리의 모서리 모양이 조금씩 달라져서, 고른 것과 붙은 것이 다르게 보인다.
 *
 * 좌표는 레이아웃의 원점(글자 상자 한가운데) 기준이다. 옮기고 키우는 일은 부르는 쪽 몫이다.
 */

export interface DrawStickerOptions {
  /** 도형만 그린다. 도형 견본처럼 모양만 보여 줄 칸에 쓴다. */
  hideText?: boolean;
}

/** 같은 경로를 매 프레임 다시 해석하지 않는다. 끌기 중에는 레이어 전체가 매 프레임 다시 그려진다. */
const pathCache = new Map<string, Path2D>();
const PATH_CACHE_LIMIT = 64;

function toPath(d: string): Path2D {
  const cached = pathCache.get(d);
  if (cached) return cached;
  // 편집 중에는 글자 하나마다 경로가 바뀐다. 쌓이지 않게 넘치면 비운다.
  if (pathCache.size >= PATH_CACHE_LIMIT) pathCache.clear();
  const path = new Path2D(d);
  pathCache.set(d, path);
  return path;
}

function drawPlate(ctx: CanvasRenderingContext2D, plate: StickerPlateLayout): void {
  const path = toPath(plate.path);

  ctx.save();
  ctx.globalAlpha *= plate.opacity;
  if (plate.sigma > 0) {
    fillSoftShape(ctx, path, plate.box, plate.color, plate.sigma);
  } else {
    ctx.fillStyle = plate.color;
    ctx.fill(path);
  }
  ctx.restore();

  // 테두리는 진하기를 따르지 않는다. 옅은 바탕에 또렷한 선을 두르는 것이 흔한 모양이다.
  if (plate.border) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = plate.border.width;
    ctx.strokeStyle = plate.border.color;
    ctx.stroke(path);
    ctx.restore();
  }
}

function drawText(ctx: CanvasRenderingContext2D, layout: TextStickerLayout): void {
  ctx.save();
  ctx.font = layout.font;
  ctx.textAlign = 'center';
  // Konva 글자와 같은 기준선이다. 줄의 가운데에 글자의 가운데를 맞춘다.
  ctx.textBaseline = 'middle';

  /*
   * 테두리를 모든 줄에 먼저 긋고 채우기를 나중에 칠한다.
   * 줄마다 테두리와 채우기를 번갈아 칠하면, 굵은 테두리가 윗줄 글자를 덮는다.
   * 모서리는 둥글게 잇는다. 굵은 테두리를 뾰족하게 이으면 한글 획 끝에서 가시가 튀어나온다.
   */
  if (layout.outline) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = layout.outline.width;
    ctx.strokeStyle = layout.outline.color;
    for (const line of layout.lines) ctx.strokeText(line.text, 0, line.y);
  }

  ctx.fillStyle = layout.color;
  for (const line of layout.lines) ctx.fillText(line.text, 0, line.y);
  ctx.restore();
}

export function drawTextSticker(
  ctx: CanvasRenderingContext2D,
  layout: TextStickerLayout,
  options: DrawStickerOptions = {},
): void {
  if (layout.plate) drawPlate(ctx, layout.plate);
  if (!options.hideText) drawText(ctx, layout);
}
