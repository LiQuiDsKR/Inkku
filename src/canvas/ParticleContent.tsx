import { useEffect, useMemo } from 'react';
import { Group, Path, Rect } from 'react-konva';
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
      {/*
        한 벌이 차지하는 사각형 전체를 누를 수 있게 한다. 조각만 눌리게 두면 빈 곳이 대부분이라
        폰에서는 거의 고를 수 없다. 그 대신 아래에 깔린 사진은 이 사각형 밖이나 레이어 목록에서 고른다.
        채우기가 투명이라 화면과 결과물에는 아무것도 그려지지 않고 히트 영역에만 들어간다.
      */}
      <Rect width={area.width} height={area.height} fill="transparent" />
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
            // 히트 영역은 뒤의 사각형이 맡는다. 조각마다 히트를 그릴 필요가 없다
            listening={false}
          />
        );
      })}
    </Group>
  );
}
