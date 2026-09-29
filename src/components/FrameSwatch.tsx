import { findFrame } from '@/layers/photoFrame';
import type { FrameStyle } from '@/layers/photoFrame';

/**
 * 프레임 견본.
 *
 * 캔버스는 Konva로, 여기는 SVG로 같은 프레임을 그린다(자르기 모양, 템플릿 썸네일과 같은 방식이다).
 * "빈티지"나 "필름" 같은 이름만 늘어놓으면 무엇이 나오는지 눌러 봐야 안다.
 */

const BOX = 100;


interface FrameSwatchProps {
  style: FrameStyle;
  className?: string;
}

export default function FrameSwatch({ style, className }: FrameSwatchProps) {
  const preset = findFrame(style);

  // 캔버스와 같은 비율이다. 다만 견본은 정사각형이라 짧은 변이 곧 한 변이다.
  const pad = preset.paper ? BOX * preset.pad : 0;
  const padBottom = preset.paper ? BOX * (preset.padBottom ?? preset.pad) : 0;

  const photoWidth = BOX - pad * 2;
  const photoHeight = BOX - pad - padBottom;

  // 그라데이션 id는 프레임마다 다르게 둔다. 견본이 아홉 개 나란히 서므로 같은 id면 서로 덮어쓴다
  const gradientId = `frame-photo-${style}`;

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7b267" />
          <stop offset="60%" stopColor="#4dabf7" />
          <stop offset="100%" stopColor="#2f5d8c" />
        </linearGradient>
      </defs>

      {preset.paper && (
        <rect
          width={BOX}
          height={BOX}
          rx={BOX * (preset.radius ?? 0)}
          fill={preset.paper}
        />
      )}
      <rect x={pad} y={pad} width={photoWidth} height={photoHeight} fill={`url(#${gradientId})`} />

      {style === 'vintage' && (
        <rect
          x={pad - 2}
          y={pad - 2}
          width={photoWidth + 4}
          height={photoHeight + 4}
          fill="none"
          stroke="#b9a888"
          strokeWidth={0.8}
        />
      )}

      {style === 'film' &&
        [0, 1].map((side) =>
          Array.from({ length: 5 }, (_, index) => (
            <rect
              key={`${side}-${index}`}
              x={12 + index * 18}
              y={side === 0 ? pad * 0.28 : BOX - pad * 0.72}
              width={pad * 0.62}
              height={pad * 0.44}
              rx={1}
              fill="#f4f2ec"
              opacity={0.92}
            />
          )),
        )}

      {style === 'gold' && (
        <>
          <rect x={4} y={4} width={BOX - 8} height={BOX - 8} fill="none" stroke="#e3c079" strokeWidth={1.6} />
          <rect x={7} y={7} width={BOX - 14} height={BOX - 14} fill="none" stroke="#e3c079" strokeWidth={0.6} />
        </>
      )}

      {style === 'dashed' && (
        <rect
          x={5}
          y={5}
          width={BOX - 10}
          height={BOX - 10}
          rx={3}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.8}
          strokeDasharray="6 5"
        />
      )}

      {/* 마주 보는 두 모서리에 붙인다. 한 군데만 붙이면 떨어질 것처럼 보인다 */}
      {style === 'tape' &&
        [`rotate(-45)`, `translate(${BOX} ${BOX}) rotate(-45)`].map((transform) => (
          <g key={transform} transform={transform}>
            <rect x={-17} y={-5.5} width={34} height={11} fill="#fffaf0" opacity={0.62} />
          </g>
        ))}
    </svg>
  );
}
