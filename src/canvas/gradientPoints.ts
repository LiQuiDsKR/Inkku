import type { Point } from './gestureMath';

/**
 * 각도를 그라데이션의 시작점과 끝점으로 바꾼다.
 *
 * Konva는 CSS처럼 각도를 받지 않고 두 점을 받는다.
 * 사각형 중심을 지나는 직선이 사각형 밖으로 나가지 않도록 반쪽 길이를 계산해야
 * 세로로 긴 캔버스에서도 색이 끝까지 다 나온다.
 */
export function gradientEndpoints(
  angleDegree: number,
  width: number,
  height: number,
): { start: Point; end: Point } {
  const radian = (angleDegree * Math.PI) / 180;
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);

  const halfLength = (Math.abs(width * cos) + Math.abs(height * sin)) / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    start: { x: centerX - cos * halfLength, y: centerY - sin * halfLength },
    end: { x: centerX + cos * halfLength, y: centerY + sin * halfLength },
  };
}
