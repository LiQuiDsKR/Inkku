import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { applyPinch, type NodeTransform, type Point } from './gestureMath';
import { snapRotation } from './snapping';
import { watchDebug } from '@/utils/debugLog';

/** 휠 한 칸(deltaY 100) 기준 약 14% 확대축소. 너무 크면 미세 조정이 안 된다. */
const ZOOM_SENSITIVITY = 0.0015;

/** 휠 한 칸당 회전 각도(도). */
const ROTATE_PER_NOTCH = 15;

/** 마지막 휠 이후 커밋까지 기다리는 시간(ms). 휠 한 번마다 커밋하면 히스토리가 수십 단계 쌓인다. */
const COMMIT_DELAY = 300;

export interface WheelGestureOptions {
  stage: Konva.Stage | null;
  getTargetNode: () => Konva.Node | null;
  onUpdate?: () => void;
  onCommit: (transform: NodeTransform) => void;
}

/** deltaMode가 줄/페이지 단위인 경우가 있어 픽셀로 환산한다. */
function toPixelDelta(event: WheelEvent): number {
  const raw = event.deltaY !== 0 ? event.deltaY : event.deltaX;
  if (event.deltaMode === 1) return raw * 16; // 줄 단위
  if (event.deltaMode === 2) return raw * 100; // 페이지 단위
  return raw;
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

function pointerLogical(stage: Konva.Stage, event: WheelEvent): Point {
  const rect = stage.container().getBoundingClientRect();
  const scale = stage.scaleX() || 1;
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
  };
}

/**
 * PC에서 두 손가락 제스처를 대신하는 휠 조작.
 *
 * 폰에서만 확인하면 개발 중 반복 테스트가 느려서 마우스 경로가 따로 필요하다.
 * 확대축소 축을 커서 위치로 잡아 두 손가락 제스처와 결과가 같게 맞춘다.
 */
export function useWheelGesture(options: WheelGestureOptions): void {
  const { stage, getTargetNode, onUpdate, onCommit } = options;

  const latest = useRef({ getTargetNode, onUpdate, onCommit });
  latest.current = { getTargetNode, onUpdate, onCommit };

  const commitTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!stage) return;
    const container = stage.container();

    const scheduleCommit = (node: Konva.Node) => {
      if (commitTimer.current !== null) window.clearTimeout(commitTimer.current);
      commitTimer.current = window.setTimeout(() => {
        commitTimer.current = null;
        latest.current.onCommit(readTransform(node));
      }, COMMIT_DELAY);
    };

    const onWheel = (event: WheelEvent) => {
      const node = latest.current.getTargetNode();
      if (!node) return;

      // 캔버스 위에서는 페이지 스크롤과 브라우저 확대(ctrl+휠)를 막는다
      event.preventDefault();

      const delta = toPixelDelta(event);
      if (delta === 0) return;

      const pivot = pointerLogical(stage, event);
      // shift나 alt를 누르면 회전. 트랙패드 핀치는 ctrl+휠로 오므로 확대축소로 둔다.
      const rotating = event.shiftKey || event.altKey;

      const current = readTransform(node);
      // 눈금 근처에서는 붙인다. 두 손가락 회전과 같은 규칙이라야 결과가 헷갈리지 않는다.
      const turned = current.rotation + (delta / 100) * ROTATE_PER_NOTCH;
      const rotation = rotating
        ? ((snapRotation(turned) - current.rotation) * Math.PI) / 180
        : 0;

      const next = applyPinch(current, {
        scaleFactor: rotating ? 1 : Math.exp(-delta * ZOOM_SENSITIVITY),
        rotation,
        from: pivot,
        to: pivot,
      });

      node.setAttrs(next);
      latest.current.onUpdate?.();
      node.getLayer()?.batchDraw();

      watchDebug('scale', next.scaleX.toFixed(3));
      watchDebug('rotation', `${next.rotation.toFixed(1)}deg`);

      scheduleCommit(node);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (commitTimer.current !== null) {
        window.clearTimeout(commitTimer.current);
        commitTimer.current = null;
      }
    };
  }, [stage]);
}
