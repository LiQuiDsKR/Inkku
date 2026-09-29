/**
 * 끌어 옮길 때 붙는 자리 계산.
 *
 * Konva나 DOM에 기대지 않는 순수 함수로 둔다. 손으로 맞춘 정렬이 한 픽셀씩 어긋나는 것은
 * 눈으로 잡기 어려운 문제라, 계산만 따로 확인할 수 있어야 한다(테스트 방침).
 */

export interface SnapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 화면에 그려 줄 안내선. at은 논리 좌표다. */
export interface SnapGuide {
  axis: 'x' | 'y';
  at: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: SnapGuide[];
}

/** 한 축에서 비교할 세 기준선: 시작, 가운데, 끝. */
function edgesOf(start: number, size: number): number[] {
  return [start, start + size / 2, start + size];
}

interface AxisSnap {
  delta: number;
  at: number;
}

/**
 * 움직이는 쪽의 기준선 중 후보에 가장 가까운 하나를 찾는다.
 * 같은 거리라면 먼저 나온 후보가 이긴다. 후보 목록을 캔버스 먼저, 다른 요소 나중으로 두는 이유다.
 * 캔버스 가운데에 맞추려는 의도가 옆 요소에 붙는 것보다 흔하다.
 */
function snapAxis(
  edges: readonly number[],
  targets: readonly number[],
  threshold: number,
): AxisSnap | null {
  let best: AxisSnap | null = null;

  for (const target of targets) {
    for (const edge of edges) {
      const delta = target - edge;
      if (Math.abs(delta) > threshold) continue;
      if (best && Math.abs(best.delta) <= Math.abs(delta)) continue;
      best = { delta, at: target };
    }
  }

  return best;
}

export interface SnapInput {
  moving: SnapBounds;
  others: readonly SnapBounds[];
  canvasWidth: number;
  canvasHeight: number;
  /** 이 거리 안에 들어오면 붙는다(논리 좌표). */
  threshold: number;
}

/**
 * 캔버스의 네 변과 두 중심선, 그리고 다른 요소의 변과 중심에 붙인다.
 *
 * 두 축을 따로 계산한다. 한 축만 걸렸다고 다른 축까지 붙여 버리면
 * 가로만 맞추려던 손이 세로로도 끌려가서 손맛이 나빠진다.
 */
export function computeSnap(input: SnapInput): SnapResult {
  const { moving, others, canvasWidth, canvasHeight, threshold } = input;

  const xTargets = [0, canvasWidth / 2, canvasWidth];
  const yTargets = [0, canvasHeight / 2, canvasHeight];

  for (const other of others) {
    xTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
    yTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
  }

  const x = snapAxis(edgesOf(moving.x, moving.width), xTargets, threshold);
  const y = snapAxis(edgesOf(moving.y, moving.height), yTargets, threshold);

  const guides: SnapGuide[] = [];
  if (x) guides.push({ axis: 'x', at: x.at });
  if (y) guides.push({ axis: 'y', at: y.at });

  return { dx: x?.delta ?? 0, dy: y?.delta ?? 0, guides };
}

/** 회전이 붙는 간격(도). 45도마다 붙으면 기울임과 뒤집기 사이의 애매한 각이 사라진다. */
export const ROTATION_STEP = 45;

/** 이 각도 안으로 들어오면 눈금에 붙는다. 너무 넓으면 일부러 비스듬히 두는 것이 불가능해진다. */
const ROTATION_TOLERANCE = 6;

/** 눈금에 가까우면 붙인 각도를, 아니면 그대로 돌려준다. */
export function snapRotation(degree: number, tolerance = ROTATION_TOLERANCE): number {
  const nearest = Math.round(degree / ROTATION_STEP) * ROTATION_STEP;
  return Math.abs(degree - nearest) <= tolerance ? nearest : degree;
}

/** 회전 눈금 목록. Konva Transformer의 rotationSnaps가 그대로 받는다. */
export const ROTATION_SNAPS: readonly number[] = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * 화면에 보여 줄 각도 문구.
 * -180 ~ 180으로 접어서 "350도"가 아니라 "-10도"로 읽히게 한다. 사람은 기울기를 그렇게 센다.
 */
export function formatAngle(degree: number): string {
  let value = Math.round(degree) % 360;
  if (value > 180) value -= 360;
  if (value <= -180) value += 360;
  return `${value > 0 ? '+' : ''}${value}°`;
}
