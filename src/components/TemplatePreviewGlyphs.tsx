import { findIconPath } from '@/templates/icons';

/**
 * 썸네일(SVG)에서 여러 파트가 같이 쓰는 그림 조각.
 * 아이콘은 스펙의 아이콘 파트와 줄 안의 아이콘이, 더하기 표시는 사진 자리가 쓴다.
 */

interface IconGlyphProps {
  icon: string;
  x: number;
  y: number;
  size: number;
  color: string;
  solid?: boolean;
}

/** 아이콘 하나. 좌표가 스펙에서 오든 줄 계산에서 오든 그리는 방법은 같다. */
export function IconGlyph({ icon, x, y, size, color, solid }: IconGlyphProps) {
  const path = findIconPath(icon);
  if (!path) return null;

  return (
    <path
      d={path}
      transform={`translate(${x} ${y}) scale(${size / 24})`}
      fill={solid ? color : 'none'}
      stroke={solid ? 'none' : color}
      strokeWidth={solid ? 0 : 2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function PlusMark({ part }: { part: { x: number; y: number; width: number; height: number } }) {
  const size = Math.min(72, Math.min(part.width, part.height) * 0.44);
  const x = part.x + part.width / 2;
  const y = part.y + part.height / 2;
  const arm = size * 0.31;

  return (
    <g>
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        rx={size * 0.28}
        fill="#ffffff"
        stroke="#16181d"
        strokeWidth={size * 0.055}
      />
      <path
        d={`M${x} ${y - arm}V${y + arm}M${x - arm} ${y}H${x + arm}`}
        stroke="#16181d"
        strokeWidth={size * 0.062}
        strokeLinecap="round"
      />
    </g>
  );
}
