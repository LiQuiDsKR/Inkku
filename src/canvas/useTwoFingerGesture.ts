import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import {
  angleOf,
  applyPinch,
  distance,
  midpoint,
  normalizeAngle,
  type NodeTransform,
  type Point,
} from './gestureMath';
import { watchDebug } from '@/utils/debugLog';

interface GestureSession {
  node: Konva.Node;
  start: NodeTransform;
  startCenter: Point;
  startDistance: number;
  lastAngle: number;
  accumRotation: number;
  wasDraggable: boolean;
}

export interface TwoFingerGestureOptions {
  /** 스테이지는 크기 측정이 끝난 뒤에야 마운트되므로 ref가 아니라 값으로 받는다. */
  stage: Konva.Stage | null;
  /** 제스처 대상. 선택된 레이어가 없으면 null을 준다. */
  getTargetNode: () => Konva.Node | null;
  /** 제스처 도중 매 프레임 호출. Transformer 핸들이 따라오게 하는 데 쓴다. */
  onUpdate?: () => void;
  /** 손을 뗄 때 한 번 호출. 스토어 반영과 히스토리 기록은 여기서만 한다. */
  onCommit: (transform: NodeTransform) => void;
}

/** 화면 좌표를 스테이지 논리 좌표로 바꾼다. 스테이지가 축소되어 있으므로 배율을 나눠야 한다. */
function toLogical(stage: Konva.Stage, touch: Touch): Point {
  const rect = stage.container().getBoundingClientRect();
  const scale = stage.scaleX() || 1;
  return {
    x: (touch.clientX - rect.left) / scale,
    y: (touch.clientY - rect.top) / scale,
  };
}

function readTransform(node: Konva.Node): NodeTransform {
  return {
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
  };
}

/**
 * 두 손가락 확대/회전/이동.
 *
 * Konva의 합성 이벤트는 포인터를 하나로 정규화해서 멀티터치 정보를 잃는다.
 * 그래서 스테이지 컨테이너에 네이티브 리스너를 직접 건다.
 */
export function useTwoFingerGesture(options: TwoFingerGestureOptions): void {
  const { stage, getTargetNode, onUpdate, onCommit } = options;

  // 리스너는 스테이지가 바뀔 때만 다시 붙인다.
  // 콜백을 의존성에 넣으면 렌더마다 재부착되어 제스처 도중 리스너가 끊긴다.
  const latest = useRef({ getTargetNode, onUpdate, onCommit });
  latest.current = { getTargetNode, onUpdate, onCommit };

  const sessionRef = useRef<GestureSession | null>(null);

  useEffect(() => {
    if (!stage) return;
    const container = stage.container();

    const endSession = () => {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      session.node.draggable(session.wasDraggable);
      latest.current.onCommit(readTransform(session.node));
    };

    const onTouchStart = (event: TouchEvent) => {
      watchDebug('pointers', event.touches.length);
      if (event.touches.length !== 2) return;

      const first = event.touches.item(0);
      const second = event.touches.item(1);
      const node = latest.current.getTargetNode();
      if (!first || !second || !node) return;

      const a = toLogical(stage, first);
      const b = toLogical(stage, second);

      // 한 손가락 드래그가 진행 중이면 멈춘다. 그대로 두면 이동과 확대가 서로 밀어낸다.
      if (node.isDragging()) node.stopDrag();
      const wasDraggable = node.draggable();
      node.draggable(false);

      sessionRef.current = {
        node,
        wasDraggable,
        start: readTransform(node),
        startCenter: midpoint(a, b),
        startDistance: distance(a, b),
        lastAngle: angleOf(a, b),
        accumRotation: 0,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const session = sessionRef.current;
      if (!session || event.touches.length < 2) return;

      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (!first || !second) return;

      // touch-action: none이 있어도 일부 기기의 시스템 제스처가 끼어들어 한 번 더 막는다
      event.preventDefault();

      const a = toLogical(stage, first);
      const b = toLogical(stage, second);
      const currentAngle = angleOf(a, b);

      // 시작 시점이 아니라 직전 프레임과 비교해 누적해야 한 바퀴를 넘겨도 이어서 돈다
      session.accumRotation += normalizeAngle(currentAngle - session.lastAngle);
      session.lastAngle = currentAngle;

      const next = applyPinch(session.start, {
        scaleFactor: session.startDistance > 0 ? distance(a, b) / session.startDistance : 1,
        rotation: session.accumRotation,
        from: session.startCenter,
        to: midpoint(a, b),
      });

      session.node.setAttrs(next);
      latest.current.onUpdate?.();
      session.node.getLayer()?.batchDraw();

      watchDebug('scale', next.scaleX.toFixed(3));
      watchDebug('rotation', `${next.rotation.toFixed(1)}deg`);
    };

    const onTouchEnd = (event: TouchEvent) => {
      watchDebug('pointers', event.touches.length);
      if (event.touches.length < 2) endSession();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [stage]);
}
