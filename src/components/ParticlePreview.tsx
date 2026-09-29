import { dotScale, scatterParticles, type ParticleShape } from '@/layers/particles';

/** 썸네일 좌표계. 캔버스의 기준 크기와 달라도 비율만 같으면 같은 인상이 나온다. */
const BOX = 100;

/** 목록에서 쓰는 seed. 고정값이라 목록이 다시 그려져도 썸네일이 춤추지 않는다. */
const PREVIEW_SEED = 20260913;

interface ParticlePreviewProps {
  shape: ParticleShape;
  color: string;
  className?: string;
}

/**
 * 파티클 썸네일.
 *
 * 캔버스와 같은 흩뿌리기 계산을 SVG로 그린다(템플릿 썸네일과 같은 방식이다).
 * 그림을 따로 그려 두면 파티클을 고쳤을 때 목록만 옛 모양으로 남는다.
 */
export default function ParticlePreview({ shape, color, className }: ParticlePreviewProps) {
  // 칸이 작아서 캔버스와 같은 개수를 뿌리면 뭉쳐 보인다. 절반만 뿌려 성격만 보여 준다.
  const dots = scatterParticles(PREVIEW_SEED, Math.ceil(shape.count / 2), BOX, BOX);

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} className={className} aria-hidden="true" focusable="false">
      {dots.map((dot, index) => (
        <path
          key={index}
          d={shape.path}
          transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rotation}) scale(${dotScale(
            dot.size,
          )}) translate(-12 -12)`}
          fill={shape.stroke ? 'none' : color}
          stroke={shape.stroke ? color : 'none'}
          strokeWidth={shape.stroke ? 1.7 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={dot.opacity}
        />
      ))}
    </svg>
  );
}
