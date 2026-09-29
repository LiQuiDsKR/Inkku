import type Konva from 'konva';
import type { PhotoMask } from '@/layers/types';

/**
 * 사진을 도형 모양으로 자르는 경로.
 *
 * 사진을 도형 노드에 무늬로 채우지 않고 클리핑으로 자른다.
 * 무늬로 채우면 지금 사진이 쓰고 있는 보정 필터(cache 기반)와 테두리 계산을 전부 다시 짜야 하고,
 * 확대할 때 무늬 배율까지 따로 맞춰야 한다. 자르기는 그리는 방식을 건드리지 않는다.
 */

/** 둥근 사각형의 모서리 반경(짧은 변 기준). 폰 화면에서 "살짝 둥근" 정도로 보이는 값이다. */
const ROUND_RATIO = 0.12;

/** 별의 안쪽 반지름 비율. 도형 레이어의 별과 같은 값이라 둘이 나란히 놓여도 같은 별로 보인다. */
const STAR_INNER = 0.44;

/** 제어점 둘과 끝점 하나. 베지어 한 구간을 그리는 데 필요한 값이다. */
type Curve = readonly [number, number, number, number, number, number];

/** 하트 경로. 도형 레이어의 하트와 같은 256 정사각형 좌표라 둘이 같은 모양으로 보인다. */
const HEART: readonly Curve[] = [
  [24, 156, 24, 92, 24, 92],
  [24, 56, 52, 32, 84, 32],
  [104, 32, 120, 42, 128, 58],
  [136, 42, 152, 32, 172, 32],
  [204, 32, 232, 56, 232, 92],
  [232, 156, 128, 220, 128, 220],
];

function starPath(ctx: Konva.Context, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.min(width, height) / 2;
  const inner = outer * STAR_INNER;

  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    // 꼭짓점 하나가 위를 보게 -90도에서 시작한다
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heartPath(ctx: Konva.Context, width: number, height: number): void {
  const sx = width / 256;
  const sy = height / 256;

  ctx.beginPath();
  ctx.moveTo(128 * sx, 220 * sy);
  // 첫 곡선의 제어점 하나는 시작점과 같다. 원본 경로를 그대로 옮긴 값이다.
  ctx.bezierCurveTo(128 * sx, 220 * sy, 24 * sx, 156 * sy, 24 * sx, 92 * sy);
  for (const [c1x, c1y, c2x, c2y, x, y] of HEART.slice(1)) {
    ctx.bezierCurveTo(c1x * sx, c1y * sy, c2x * sx, c2y * sy, x * sx, y * sy);
  }
  ctx.closePath();
}

function roundedPath(ctx: Konva.Context, width: number, height: number): void {
  const r = Math.min(width, height) * ROUND_RATIO;

  // Konva의 Context에는 roundRect가 없어서 arcTo 네 번으로 그린다
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(width, 0, width, height, r);
  ctx.arcTo(width, height, 0, height, r);
  ctx.arcTo(0, height, 0, 0, r);
  ctx.arcTo(0, 0, width, 0, r);
  ctx.closePath();
}

function polygonPath(ctx: Konva.Context, points: readonly (readonly [number, number])[]): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/**
 * 도형별 클리핑 경로.
 * 크기를 받아서 그때그때 그린다. 사진마다 크기가 달라 미리 만들어 둘 수 없다.
 */
export function maskClip(
  mask: PhotoMask,
  width: number,
  height: number,
): (ctx: Konva.Context) => void {
  return (ctx) => {
    switch (mask) {
      case 'rounded':
        roundedPath(ctx, width, height);
        return;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2, false);
        ctx.closePath();
        return;
      case 'star':
        starPath(ctx, width, height);
        return;
      case 'heart':
        heartPath(ctx, width, height);
        return;
      case 'triangle':
        polygonPath(ctx, [
          [width / 2, 0],
          [width, height],
          [0, height],
        ]);
        return;
      case 'diamond':
        polygonPath(ctx, [
          [width / 2, 0],
          [width, height / 2],
          [width / 2, height],
          [0, height / 2],
        ]);
        return;
      default:
        // 모양이 늘어나면 여기서 걸린다. 새 모양은 반드시 위에 한 줄을 더한다.
        return;
    }
  };
}
