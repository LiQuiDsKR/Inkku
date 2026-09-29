import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { LAYER_NODE_NAME } from './useDragSnap';

/** 꾹 누른 것으로 치는 시간(ms). 더 짧으면 끌려던 손이 자꾸 걸린다. */
const HOLD_MS = 450;

/** 이만큼 움직이면 끌려는 손으로 본다(화면 픽셀). */
const MOVE_TOLERANCE = 10;

export interface LongPressOptions {
  konvaLayer: Konva.Layer | null;
  /** 요소를 꾹 눌렀다. 레이어 id를 준다. */
  onLongPress: (layerId: string) => void;
}

/**
 * 요소를 꾹 누르는 동작.
 *
 * Konva에는 길게 누르기가 없다. 레이어에 이벤트를 걸어 눌린 노드의 id를 본다.
 * 누른 채 손가락이 움직이면 끌기이므로 취소한다. 그래야 옮기려는 손과 부딪히지 않는다.
 */
export function useLongPress({ konvaLayer, onLongPress }: LongPressOptions): void {
  const latest = useRef(onLongPress);
  latest.current = onLongPress;

  useEffect(() => {
    if (!konvaLayer) return;

    let timer: number | null = null;
    let origin: { x: number; y: number } | null = null;

    const cancel = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      origin = null;
    };

    const onDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
      cancel();

      // 요소가 아닌 곳(배경, 카드)은 꾹 눌러도 할 일이 없다
      const node = event.target.findAncestor(`.${LAYER_NODE_NAME}`, true);
      const layerId = node?.id();
      if (!layerId) return;

      origin = { x: event.evt.clientX, y: event.evt.clientY };
      timer = window.setTimeout(() => {
        timer = null;
        latest.current(layerId);
      }, HOLD_MS);
    };

    const onMove = (event: Konva.KonvaEventObject<PointerEvent>) => {
      if (!origin || timer === null) return;
      const moved =
        Math.abs(event.evt.clientX - origin.x) + Math.abs(event.evt.clientY - origin.y);
      if (moved > MOVE_TOLERANCE) cancel();
    };

    konvaLayer.on('pointerdown', onDown);
    konvaLayer.on('pointermove', onMove);
    konvaLayer.on('pointerup', cancel);
    konvaLayer.on('dragstart', cancel);

    return () => {
      cancel();
      konvaLayer.off('pointerdown', onDown);
      konvaLayer.off('pointermove', onMove);
      konvaLayer.off('pointerup', cancel);
      konvaLayer.off('dragstart', cancel);
    };
  }, [konvaLayer]);
}
