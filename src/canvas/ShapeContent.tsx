import { useEffect } from 'react';
import { Path } from 'react-konva';
import { findShape } from '@/layers/shapeCatalog';
import { SHAPE_BASE_SIZE } from '@/layers/shapeStyle';
import type { ShapeLayer } from '@/layers/types';

interface ShapeContentProps {
  layer: ShapeLayer;
  onReady: () => void;
}

const HALF = SHAPE_BASE_SIZE / 2;

/**
 * 도형의 그리기만 담당한다.
 *
 * 모양은 전부 경로 하나다(`shapeCatalog`). 패널 견본이 같은 경로를 SVG로 그리므로
 * 고른 모양과 놓인 모양이 어긋나지 않는다.
 * 256 정사각형의 가운데를 원점으로 옮긴다. 그래야 상위 Group의 회전축이 도형 한가운데가 되어
 * 사진, 스티커, 글자와 손맛이 같아진다.
 */
export default function ShapeContent({ layer, onReady }: ShapeContentProps) {
  // 도형은 비동기 로딩이 없지만 히트 그래프는 마찬가지로 다시 그려야 한다
  useEffect(() => {
    onReady();
  }, [layer.shape, layer.fill, layer.stroke?.width, onReady]);

  return (
    <Path
      data={findShape(layer.shape).path}
      offsetX={HALF}
      offsetY={HALF}
      fill={layer.fill}
      stroke={layer.stroke?.color}
      strokeWidth={layer.stroke?.width ?? 0}
    />
  );
}
