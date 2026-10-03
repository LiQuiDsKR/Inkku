/**
 * 가장자리가 흐린 도형 그리기.
 *
 * 캔버스의 `filter = 'blur()'`를 쓰지 않는다. iOS 사파리가 오랫동안 지원하지 않던 기능이라
 * 아이폰에서는 흐림 없이 또렷한 도형이 나온다. 대신 어느 브라우저에서나 되는 그림자 흐림을 쓴다.
 * 도형을 버퍼의 오른쪽 절반에 그리고 그림자만 왼쪽 절반에 떨어뜨린 뒤 왼쪽만 옮겨 온다.
 *
 * 그림자의 흐림과 위치는 캔버스 변환(회전, 확대)을 따르지 않는 화면 픽셀 값이다.
 * 회전한 스티커에 그대로 쓰면 그림자가 엉뚱한 곳에 떨어진다. 그래서 회전 없는 버퍼에서 흐린 뒤
 * 본 캔버스에는 그림으로 옮긴다. 옮기는 drawImage는 변환을 그대로 따른다.
 */

/** 버퍼 안에서의 최대 흐림(px). 이보다 흐리게 해야 하면 버퍼 해상도를 낮춘다. 흐린 그림은 낮은 해상도로 키워도 티가 나지 않는다. */
const MAX_BUFFER_SIGMA = 16;

/** iOS는 한 변 4096px를 넘는 캔버스를 만들지 못한다. 버퍼는 가로가 두 배라 절반만 쓴다. */
const MAX_BUFFER_SIDE = 4096;

/** 내보내기처럼 큰 버퍼를 쓴 뒤에는 돌려준다. 붙들고 있으면 사파리의 캔버스 메모리 한도를 먹는다. */
const RELEASE_AREA = 4_000_000;

/** 그림자 반경과 실제 퍼짐의 관계. 명세상 그림자는 shadowBlur의 절반을 표준편차로 쓴다. */
const SHADOW_BLUR_PER_SIGMA = 2;

/** 끌기 중에는 매 프레임 다시 그린다. 그때마다 캔버스를 새로 만들지 않도록 하나를 돌려 쓴다. */
let buffer: HTMLCanvasElement | null = null;

function takeBuffer(width: number, height: number): HTMLCanvasElement {
  if (!buffer) buffer = document.createElement('canvas');
  if (buffer.width < width || buffer.height < height) {
    buffer.width = Math.max(buffer.width, width);
    buffer.height = Math.max(buffer.height, height);
  }
  return buffer;
}

function releaseIfLarge(): void {
  if (buffer && buffer.width * buffer.height > RELEASE_AREA) {
    buffer.width = 0;
    buffer.height = 0;
  }
}

export interface SoftArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 흐린 도형을 그린다.
 *
 * @param box 도형이 차지하는 사각형(현재 좌표계). 흐림이 번질 자리는 여기서 계산한다.
 * @param sigma 흐림 반경(현재 좌표계 단위).
 */
export function fillSoftShape(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  box: SoftArea,
  color: string,
  sigma: number,
): void {
  const m = ctx.getTransform();
  const deviceScale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;

  // 화면에서 반 픽셀도 안 번지면 흐림이 보이지 않는다. 버퍼를 거치지 않고 그냥 칠한다.
  if (sigma * deviceScale < 0.5) {
    ctx.fillStyle = color;
    ctx.fill(path);
    return;
  }

  const margin = sigma * 3;
  const area = {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };

  let scale = deviceScale * Math.min(1, MAX_BUFFER_SIGMA / (sigma * deviceScale));
  scale = Math.min(scale, MAX_BUFFER_SIDE / 2 / area.width, MAX_BUFFER_SIDE / area.height);

  const width = Math.max(1, Math.ceil(area.width * scale));
  const height = Math.max(1, Math.ceil(area.height * scale));
  const canvas = takeBuffer(width * 2, height);
  const bctx = canvas.getContext('2d');
  if (!bctx) return;

  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.clearRect(0, 0, width * 2, height);
  // 도형은 오른쪽 절반에 놓는다. 그림자는 한 칸(width)만큼 왼쪽, 즉 왼쪽 절반의 같은 자리에 떨어진다.
  bctx.setTransform(scale, 0, 0, scale, -area.x * scale + width, -area.y * scale);
  bctx.shadowColor = color;
  bctx.shadowBlur = sigma * scale * SHADOW_BLUR_PER_SIGMA;
  bctx.shadowOffsetX = -width;
  bctx.shadowOffsetY = 0;
  bctx.fillStyle = color;
  bctx.fill(path);
  bctx.shadowColor = 'transparent';

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, width, height, area.x, area.y, area.width, area.height);
  releaseIfLarge();
}
