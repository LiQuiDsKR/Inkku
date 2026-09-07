import { useEffect } from 'react';
import { Arrow, Circle, Group, Path, Rect, RegularPolygon, Star } from 'react-konva';
import { HEART_PATH, SHAPE_BASE_SIZE } from '@/layers/shapeStyle';
import type { ShapeLayer } from '@/layers/types';

interface ShapeContentProps {
  layer: ShapeLayer;
  onReady: () => void;
}

const SIZE = SHAPE_BASE_SIZE;
const HALF = SIZE / 2;

/**
 * 도형의 그리기만 담당한다.
 *
 * 모든 도형은 원점을 중심으로 그린다. 그래야 상위 Group의 회전축이 도형 한가운데가 되어
 * 사진, 스티커, 글자와 손맛이 같아진다.
 */
export default function ShapeContent({ layer, onReady }: ShapeContentProps) {
  // 도형은 비동기 로딩이 없지만 히트 그래프는 마찬가지로 다시 그려야 한다
  useEffect(() => {
    onReady();
  }, [layer.shape, layer.fill, layer.stroke?.width, onReady]);

  const common = {
    fill: layer.fill,
    stroke: layer.stroke?.color,
    strokeWidth: layer.stroke?.width ?? 0,
  };

  return (
    <Group scaleX={layer.flipX ? -1 : 1}>
      {layer.shape === 'rect' && (
        <Rect
          {...common}
          width={SIZE}
          height={SIZE}
          offsetX={HALF}
          offsetY={HALF}
          cornerRadius={SIZE * 0.08}
        />
      )}
      {layer.shape === 'circle' && <Circle {...common} radius={HALF} />}
      {layer.shape === 'triangle' && <RegularPolygon {...common} sides={3} radius={HALF} />}
      {layer.shape === 'star' && (
        <Star {...common} numPoints={5} innerRadius={SIZE * 0.22} outerRadius={HALF} />
      )}
      {layer.shape === 'heart' && (
        <Path {...common} data={HEART_PATH} offsetX={HALF} offsetY={HALF} />
      )}
      {layer.shape === 'arrow' && (
        <Arrow
          {...common}
          points={[-HALF, 0, HALF, 0]}
          pointerLength={SIZE * 0.28}
          pointerWidth={SIZE * 0.34}
          // 화살표는 채우기만 있으면 선이 안 보인다. 선 두께를 따로 준다.
          strokeWidth={layer.stroke?.width ?? SIZE * 0.12}
          stroke={layer.stroke?.color ?? layer.fill}
        />
      )}
    </Group>
  );
}
