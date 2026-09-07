/**
 * 두 손가락 제스처를 레이어 변환으로 바꾸는 순수 함수 모음.
 * Konva나 DOM에 의존하지 않게 분리해서, 제스처가 어색할 때
 * 이벤트 처리 문제인지 계산 문제인지 따로 확인할 수 있게 한다.
 */

export interface Point {
  x: number;
  y: number;
}

export interface NodeTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degree
}

/** 손으로 잡을 수 있는 범위. 너무 작아지면 다시 집을 수 없고, 너무 커지면 렌더가 무거워진다. */
export const MIN_LAYER_SCALE = 0.02;
export const MAX_LAYER_SCALE = 8;

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function angleOf(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * 각도 차이를 -PI ~ PI로 접는다.
 * atan2는 PI 경계에서 값이 튀어서, 프레임 간 차이를 그대로 더하면
 * 손가락을 조금 돌렸을 뿐인데 레이어가 한 바퀴 도는 현상이 생긴다.
 */
export function normalizeAngle(radian: number): number {
  let result = radian;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface PinchDelta {
  /** 제스처 시작 시점 대비 손가락 간격 비율. */
  scaleFactor: number;
  /** 제스처 시작 시점 대비 누적 회전량(라디안). */
  rotation: number;
  /** 제스처 시작 시점의 두 손가락 중심(논리 좌표). */
  from: Point;
  /** 현재 두 손가락 중심(논리 좌표). */
  to: Point;
}

/**
 * 두 손가락 사이 중심을 축으로 확대/회전하고, 중심이 움직인 만큼 함께 옮긴다.
 * 캔버스 원점이 아니라 손가락 중심을 축으로 삼아야
 * 잡고 있는 지점이 손끝에 붙어 있는 느낌이 난다.
 */
export function applyPinch(start: NodeTransform, delta: PinchDelta): NodeTransform {
  // 상한/하한에 걸렸을 때 위치 계산까지 같은 배율을 써야 레이어가 손가락에서 미끄러지지 않는다
  const clampedScaleX = clamp(start.scaleX * delta.scaleFactor, MIN_LAYER_SCALE, MAX_LAYER_SCALE);
  const factor = start.scaleX !== 0 ? clampedScaleX / start.scaleX : 1;

  const cos = Math.cos(delta.rotation);
  const sin = Math.sin(delta.rotation);

  const dx = start.x - delta.from.x;
  const dy = start.y - delta.from.y;

  return {
    x: delta.to.x + (dx * cos - dy * sin) * factor,
    y: delta.to.y + (dx * sin + dy * cos) * factor,
    scaleX: start.scaleX * factor,
    scaleY: start.scaleY * factor,
    rotation: start.rotation + (delta.rotation * 180) / Math.PI,
  };
}
