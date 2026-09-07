import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import type { Point } from './gestureMath';

/** 이 거리(논리 좌표)보다 가까운 점은 버린다. 점이 촘촘하면 굽는 비용만 늘고 모양은 같다. */
const MIN_POINT_DISTANCE = 2;

export interface BrushDrawingOptions {
  stage: Konva.Stage | null;
  /** 미리보기 선. 스토어를 거치지 않고 이 노드만 직접 갱신해야 손끝을 따라온다. */
  previewLine: Konva.Line | null;
  enabled: boolean;
  /** 손을 뗀 시점에 한 번 호출. 굽고 저장하는 일은 여기서 시작한다. */
  onStrokeEnd: (points: readonly Point[]) => void;
}

/**
 * 손가락으로 자유롭게 긋기.
 *
 * 점이 들어올 때마다 리액트 상태를 갱신하면 획이 길어질수록 프레임이 떨어진다.
 * 점은 ref에 쌓고 Konva 노드만 직접 갱신한 뒤, 손을 뗄 때 한 번만 상위로 알린다.
 */
export function useBrushDrawing(options: BrushDrawingOptions): void {
  const { stage, previewLine, enabled, onStrokeEnd } = options;

  const latest = useRef({ onStrokeEnd, previewLine });
  latest.current = { onStrokeEnd, previewLine };

  const pointsRef = useRef<Point[]>([]);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stage || !enabled) return;
    const container = stage.container();

    const toLogical = (event: PointerEvent): Point => {
      const rect = container.getBoundingClientRect();
      const scale = stage.scaleX() || 1;
      return {
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale,
      };
    };

    const redraw = () => {
      const line = latest.current.previewLine;
      if (!line) return;
      // Konva Line은 평평한 숫자 배열을 받는다
      line.points(pointsRef.current.flatMap((point) => [point.x, point.y]));
      line.getLayer()?.batchDraw();
    };

    const onPointerDown = (event: PointerEvent) => {
      // 두 번째 손가락은 무시한다. 받아 주면 두 손가락으로 잡을 때 획이 튄다.
      if (pointerIdRef.current !== null) return;
      pointerIdRef.current = event.pointerId;
      pointsRef.current = [toLogical(event)];
      redraw();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      event.preventDefault();

      const point = toLogical(event);
      const previous = pointsRef.current[pointsRef.current.length - 1];
      if (previous) {
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        if (Math.hypot(dx, dy) < MIN_POINT_DISTANCE) return;
      }

      pointsRef.current.push(point);
      redraw();
    };

    const finish = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;

      const points = pointsRef.current;
      pointsRef.current = [];
      // 미리보기를 먼저 비운다. 굽는 동안 남아 있으면 굳힌 레이어와 겹쳐 두 겹으로 보인다.
      redraw();

      if (points.length > 0) latest.current.onStrokeEnd(points);
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: false });
    container.addEventListener('pointerup', finish);
    container.addEventListener('pointercancel', finish);
    container.addEventListener('pointerleave', finish);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', finish);
      container.removeEventListener('pointercancel', finish);
      container.removeEventListener('pointerleave', finish);
      pointerIdRef.current = null;
      pointsRef.current = [];
    };
  }, [stage, enabled]);
}
