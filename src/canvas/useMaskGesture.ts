import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import {
  CENTER_OFFSET,
  clampZoom,
  cropFit,
  maskFrame,
  offsetAfterDrag,
  type CropFit,
  type Offset,
  type Size,
} from '@/layers/photoCrop';
import type { PhotoLayer } from '@/layers/types';
import type { Point } from './gestureMath';

/** 도형 안에서 사진을 맞출 때 바뀌는 값. */
export interface MaskAdjust {
  maskZoom: number;
  maskOffset: Offset;
}

export interface MaskGestureOptions {
  stage: Konva.Stage | null;
  /** 맞추는 중인 사진. null이면 아무 일도 하지 않는다. */
  layer: PhotoLayer | null;
  /** 그 사진을 그리고 있는 Konva 노드. 손가락을 따라 바로 고치려면 노드가 필요하다. */
  getImageNode: () => Konva.Image | null;
  /** 손을 뗄 때 한 번. 스토어 반영과 히스토리 기록은 여기서만 한다. */
  onCommit: (adjust: MaskAdjust) => void;
}

interface Session {
  node: Konva.Image;
  source: Size;
  frame: Size;
  /** 절대 좌표를 사진 안쪽 좌표로 바꾸는 변환. 제스처 도중에는 바뀌지 않는다. */
  toLocal: Konva.Transform;
  anchor: Point;
  distance: number;
  offset: Offset;
  zoom: number;
  /** 필터를 구워 둔 상태였는지. 맞추는 동안에는 캐시를 버리고 끝나면 되돌린다. */
  wasCached: boolean;
}

function distanceOf(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpointOf(points: readonly Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * 도형으로 자른 사진을 도형 안에서 밀고 키우는 제스처.
 *
 * 요소를 옮기는 것이 아니라 "창 안에서 사진만" 움직인다. 그래서 레이어의 위치와 배율은
 * 건드리지 않고 잘라 낼 영역만 바꾼다. 손가락을 따라가는 동안에는 스토어를 건드리지 않고
 * 노드를 직접 고친다. 매 프레임 리렌더가 돌면 큰 사진에서 손이 끊긴다.
 */
export function useMaskGesture(options: MaskGestureOptions): void {
  const { stage, layer, getImageNode, onCommit } = options;

  const latest = useRef({ layer, getImageNode, onCommit });
  latest.current = { layer, getImageNode, onCommit };

  const sessionRef = useRef<Session | null>(null);
  const pointersRef = useRef(new Map<number, Point>());

  useEffect(() => {
    if (!stage || !layer) return;
    const container = stage.container();

    /** 화면 좌표를 스테이지 절대 좌표로. 컨테이너 안에서의 거리다. */
    const toStage = (event: PointerEvent): Point => {
      const rect = container.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const currentFit = (session: Session): CropFit =>
      cropFit(session.source, session.frame, session.zoom, session.offset);

    /**
     * 손가락 수가 바뀌면 기준을 다시 잡는다.
     * 그대로 두면 두 번째 손가락이 닿는 순간 사진이 튄다.
     */
    const rebase = (session: Session) => {
      const points = [...pointersRef.current.values()];
      if (points.length === 0) return;
      session.anchor = session.toLocal.point(midpointOf(points));
      session.distance = points.length > 1 && points[0] && points[1]
        ? distanceOf(points[0], points[1])
        : 0;
    };

    const startSession = (): Session | null => {
      const target = latest.current.layer;
      const node = latest.current.getImageNode();
      const frame = target ? maskFrame(target) : null;
      if (!target || !node || !frame) return null;

      const wasCached = node.isCached();
      // 구운 그림은 그릴 당시의 잘린 모양을 담고 있어서, 캐시를 둔 채로는 사진이 움직이지 않는다
      if (wasCached) node.clearCache();

      const session: Session = {
        node,
        source: { width: target.naturalWidth, height: target.naturalHeight },
        frame,
        toLocal: node.getAbsoluteTransform().copy().invert(),
        anchor: { x: 0, y: 0 },
        distance: 0,
        offset: target.maskOffset ?? CENTER_OFFSET,
        zoom: target.maskZoom ?? 1,
        wasCached,
      };
      rebase(session);
      return session;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointersRef.current.set(event.pointerId, toStage(event));

      if (!sessionRef.current) sessionRef.current = startSession();
      else rebase(sessionRef.current);
    };

    const onPointerMove = (event: PointerEvent) => {
      /*
       * 꾹 눌러 이 모드로 들어온 손가락은 이미 내려와 있어서 pointerdown을 받지 못한다.
       * 그대로 두면 손을 한 번 뗐다 다시 대야 움직여서, 꾹 누른 흐름이 끊긴다.
       * 눌린 채로 들어온 첫 움직임을 시작점으로 잡는다.
       */
      if (!sessionRef.current && event.buttons !== 0) {
        pointersRef.current.set(event.pointerId, toStage(event));
        sessionRef.current = startSession();
        return;
      }

      const session = sessionRef.current;
      if (!session || !pointersRef.current.has(event.pointerId)) return;

      event.preventDefault();
      pointersRef.current.set(event.pointerId, toStage(event));

      const points = [...pointersRef.current.values()];
      const first = points[0];
      const second = points[1];

      // 두 손가락은 벌린 만큼 키운다. 키운 뒤에도 밀던 자리는 그대로 유지된다.
      if (first && second && session.distance > 0) {
        session.zoom = clampZoom(session.zoom * (distanceOf(first, second) / session.distance));
        session.distance = distanceOf(first, second);
      }

      const local = session.toLocal.point(midpointOf(points));
      session.offset = offsetAfterDrag(
        session.offset,
        currentFit(session),
        session.frame,
        local.x - session.anchor.x,
        local.y - session.anchor.y,
      );
      session.anchor = local;

      session.node.crop(currentFit(session).crop);
      session.node.getLayer()?.batchDraw();
    };

    const endPointer = (event: PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      const session = sessionRef.current;
      if (!session || pointersRef.current.size > 0) {
        if (session) rebase(session);
        return;
      }

      sessionRef.current = null;
      // 캐시는 스토어가 바뀌면 PhotoContent가 다시 굽는다. 여기서는 되돌릴 것만 표시해 둔다.
      if (session.wasCached) session.node.getLayer()?.batchDraw();
      latest.current.onCommit({ maskZoom: session.zoom, maskOffset: session.offset });
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: false });
    container.addEventListener('pointerup', endPointer);
    container.addEventListener('pointercancel', endPointer);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', endPointer);
      container.removeEventListener('pointercancel', endPointer);
      pointersRef.current.clear();
      sessionRef.current = null;
    };
    // layer의 id만 보면 된다. 값이 바뀔 때마다 리스너를 다시 걸면 제스처 도중에 끊긴다.
  }, [stage, layer?.id]);
}
