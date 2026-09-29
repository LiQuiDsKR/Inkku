import { useEffect, useMemo } from 'react';
import { Group, Path } from 'react-konva';
import { findParticleShape } from '@/layers/particleCatalog';
import {
  GLYPH_STROKE_WIDTH,
  dotScale,
  particleArea,
  scatterParticles,
} from '@/layers/particles';
import type { ParticleLayer } from '@/layers/types';

interface ParticleContentProps {
  layer: ParticleLayer;
  onReady: () => void;
}

/**
 * 파티클의 그리기만 담당한다.
 *
 * 흩뿌린 자리는 seed에서 매번 다시 계산한다. 저장된 것은 seed 하나뿐이라
 * 같은 레이어는 언제나 같은 모양으로 다시 그려진다(내보내기에서도 마찬가지다).
 */
export default function ParticleContent({ layer, onReady }: ParticleContentProps) {
  const area = useMemo(() => particleArea(layer.aspect), [layer.aspect]);

  // 계산이 가볍긴 하지만 매 렌더마다 새 배열을 만들면 Konva 노드가 통째로 다시 생긴다
  const dots = useMemo(
    () => scatterParticles(findParticleShape(layer.kind), layer.seed, layer.count, area),
    [layer.kind, layer.seed, layer.count, area],
  );

  // 파티클은 비동기 로딩이 없지만 히트 그래프는 마찬가지로 다시 그려야 한다
  useEffect(() => {
    onReady();
  }, [onReady, layer.color, dots]);

  return (
    // 원점을 한 벌의 한가운데로 옮긴다. 회전축이 가운데여야 다른 요소와 손맛이 같다.
    <Group offsetX={area.width / 2} offsetY={area.height / 2}>
      {dots.map((dot, index) => {
        const scale = dotScale(dot.size);
        const color = dot.tint ?? layer.color;
        const stroke = dot.glyph.stroke === true;
        return (
          <Path
            key={index}
            data={dot.glyph.path}
            x={dot.x}
            y={dot.y}
            // 경로는 24 좌표계의 왼쪽 위가 원점이라, 가운데를 회전축으로 옮겨야 제자리에서 돈다
            offsetX={12}
            offsetY={12}
            scaleX={scale}
            scaleY={scale}
            rotation={dot.rotation}
            opacity={dot.opacity}
            fill={stroke ? undefined : color}
            stroke={stroke ? color : undefined}
            strokeWidth={stroke ? GLYPH_STROKE_WIDTH : 0}
            lineCap="round"
            lineJoin="round"
            /*
             * 조각 하나하나만 눌린다. 뒤에 보이지 않는 사각형을 깔면 고르기는 쉬워지지만
             * 파티클이 캔버스의 절반을 덮고 있어서 아래에 있는 사진을 영영 못 누르게 된다.
             * 대신 선으로 그리는 조각은 히트 영역을 넉넉히 준다. 실선 두께로는 손가락이 못 맞춘다.
             */
            hitStrokeWidth={stroke ? 10 : undefined}
          />
        );
      })}
    </Group>
  );
}
