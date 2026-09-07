import type { Point } from '@/canvas/gestureMath';

/**
 * 손으로 그린 획을 이미지로 굽는다.
 *
 * 점을 그대로 들고 있으면 획이 쌓일수록 렌더가 무거워지고, 실행취소 스냅샷도 커진다.
 * 손을 떼는 순간 한 장의 이미지로 만들어 일반 레이어와 똑같이 다루는 편이
 * 성능과 코드 양쪽에서 유리하다.
 */

/**
 * 논리 좌표 1단위를 몇 픽셀로 구울지.
 * 편집 화면 해상도로 구우면 내보낼 때 확대되어 흐려진다. 내보내기 배율(2배)에 맞춰 둔다.
 */
export const RASTER_SCALE = 2;

/** 획 끝의 안티에일리어싱이 잘리지 않도록 두는 여유(논리 좌표). */
const EDGE_PADDING = 2;

export interface RasterizedStroke {
  blob: Blob;
  /** 논리 좌표에서의 획 영역. 레이어 위치와 크기가 여기서 나온다. */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StrokeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function strokeBounds(points: readonly Point[], strokeWidth: number): StrokeBox {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  // 선 두께의 절반만큼 사방으로 번진다. 이걸 빼먹으면 획 가장자리가 잘린다.
  const margin = strokeWidth / 2 + EDGE_PADDING;
  return {
    x: minX - margin,
    y: minY - margin,
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
  };
}

/**
 * 점 사이를 중점 기준 2차 곡선으로 잇는다.
 * 선분으로 이으면 빠르게 그은 획에서 각진 부분이 눈에 띈다.
 */
function traceStroke(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  const first = points[0];
  if (!first) return;

  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (!current || !next) continue;
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }

  const last = points[points.length - 1];
  if (last && points.length > 1) ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 낙서는 배경이 비어 있어야 하므로 반드시 PNG다. JPEG로 구우면 검은 배경이 붙는다.
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('획을 이미지로 굽지 못했다'));
    }, 'image/png');
  });
}

export async function rasterizeStroke(
  points: readonly Point[],
  color: string,
  strokeWidth: number,
): Promise<RasterizedStroke | null> {
  if (points.length === 0) return null;

  const box = strokeBounds(points, strokeWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(box.width * RASTER_SCALE));
  canvas.height = Math.max(1, Math.ceil(box.height * RASTER_SCALE));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트를 얻지 못했다');

  ctx.scale(RASTER_SCALE, RASTER_SCALE);
  ctx.translate(-box.x, -box.y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const single = points[0];
  if (points.length === 1 && single) {
    // 탭 한 번은 점 하나다. stroke로는 아무것도 안 그려져서 원으로 찍는다.
    ctx.beginPath();
    ctx.arc(single.x, single.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    traceStroke(ctx, points);
  }

  const blob = await toBlob(canvas);

  // 백킹 스토어를 즉시 반납한다. 획을 계속 그으면 캔버스가 쌓여 iOS에서 특히 문제가 된다.
  canvas.width = 0;
  canvas.height = 0;

  return { blob, x: box.x, y: box.y, width: box.width, height: box.height };
}
