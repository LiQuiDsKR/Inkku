import { useEffect, useState } from 'react';
import type Konva from 'konva';
import { computeSnap, type SnapBounds, type SnapGuide } from './snapping';

/** 붙는 거리(화면 픽셀). 논리 좌표로 바꿔 쓰기 때문에 캔버스가 작아져도 손맛이 같다. */
const SNAP_SCREEN_PX = 9;

/** 레이어 노드에 붙이는 이름. 배경과 카드, Transformer를 빼고 요소만 골라내는 데 쓴다. */
export const LAYER_NODE_NAME = 'layer-node';

export interface DragSnapOptions {
  /** 요소들이 들어 있는 Konva 레이어. 여기에 이벤트를 걸어 모든 드래그를 한 곳에서 받는다. */
  konvaLayer: Konva.Layer | null;
  stage: Konva.Stage | null;
  canvasWidth: number;
  canvasHeight: number;
}

function boundsOf(node: Konva.Node, relativeTo: Konva.Layer): SnapBounds {
  // 스테이지 배율이 섞이지 않은 논리 좌표로 받는다. 회전한 요소는 감싸는 사각형으로 잡힌다.
  const rect = node.getClientRect({ relativeTo });
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

/**
 * 끌 때 캔버스와 다른 요소에 붙여 준다.
 *
 * LayerNode가 아니라 레이어에 이벤트를 건다. 드래그 이벤트는 위로 올라오므로
 * 한 곳에서 받으면 "지금 끄는 것 말고 나머지"를 찾기도 쉽다.
 * 반환값은 그려 줄 안내선이다. 그리기는 캔버스 쪽이 한다.
 */
export function useDragSnap(options: DragSnapOptions): SnapGuide[] {
  const { konvaLayer, stage, canvasWidth, canvasHeight } = options;
  const [guides, setGuides] = useState<SnapGuide[]>([]);

  useEffect(() => {
    if (!konvaLayer || !stage) return;

    const onDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
      const target = event.target;
      // 배경이나 카드는 끌리지 않는다. 혹시 다른 것이 끌려도 스냅 대상은 요소뿐이다.
      if (!target.hasName(LAYER_NODE_NAME)) return;

      const others = konvaLayer
        .find(`.${LAYER_NODE_NAME}`)
        .filter((node) => node !== target)
        .map((node) => boundsOf(node, konvaLayer))
        // 아직 그림이 도착하지 않은 요소는 크기가 0이라 엉뚱한 자리에 붙는다
        .filter((bounds) => bounds.width > 0 && bounds.height > 0);

      const result = computeSnap({
        moving: boundsOf(target, konvaLayer),
        others,
        canvasWidth,
        canvasHeight,
        threshold: SNAP_SCREEN_PX / (stage.scaleX() || 1),
      });

      if (result.dx !== 0) target.x(target.x() + result.dx);
      if (result.dy !== 0) target.y(target.y() + result.dy);

      // 같은 안내선이 계속 이어질 때 상태를 새로 넣으면 매 프레임 리렌더가 돈다
      setGuides((prev) => (sameGuides(prev, result.guides) ? prev : result.guides));
    };

    const onDragEnd = () => setGuides([]);

    konvaLayer.on('dragmove', onDragMove);
    konvaLayer.on('dragend', onDragEnd);

    return () => {
      konvaLayer.off('dragmove', onDragMove);
      konvaLayer.off('dragend', onDragEnd);
    };
  }, [konvaLayer, stage, canvasWidth, canvasHeight]);

  return guides;
}

function sameGuides(a: readonly SnapGuide[], b: readonly SnapGuide[]): boolean {
  return (
    a.length === b.length &&
    a.every((guide, index) => guide.axis === b[index]?.axis && guide.at === b[index]?.at)
  );
}
