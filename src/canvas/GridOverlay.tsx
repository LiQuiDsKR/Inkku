import type { GridKind } from '@/store/settingsStore';

/**
 * 캔버스 보조선.
 *
 * Konva가 아니라 캔버스 위에 겹친 SVG다. 스테이지에 그리면 결과물에 찍힐 위험이 있고
 * (선택 테두리처럼 굽기 직전에 숨겨야 한다), 축소 배율에 따라 선 굵기가 같이 줄어든다.
 * 보조선은 화면에서 늘 같은 굵기여야 눈금으로 읽힌다.
 */

/** 칸 수. 없음은 0이다. */
const DIVISIONS: Record<GridKind, number> = {
  none: 0,
  '2x2': 2,
  '3x3': 3,
  '4x4': 4,
};

export function gridDivisions(kind: GridKind): number {
  return DIVISIONS[kind];
}

interface GridOverlayProps {
  kind: GridKind;
  width: number;
  height: number;
}

/** 가운데를 지나는 선인지. 중심선만 점선으로 그려 나머지와 구분한다. */
function isCenter(index: number, divisions: number): boolean {
  return divisions % 2 === 0 && index === divisions / 2;
}

function linePath(width: number, height: number, divisions: number, center: boolean): string {
  const parts: string[] = [];

  for (let i = 1; i < divisions; i += 1) {
    if (isCenter(i, divisions) !== center) continue;
    const x = (width * i) / divisions;
    const y = (height * i) / divisions;
    parts.push(`M${x} 0V${height}`, `M0 ${y}H${width}`);
  }

  return parts.join(' ');
}

export default function GridOverlay({ kind, width, height }: GridOverlayProps) {
  const divisions = gridDivisions(kind);
  if (divisions === 0) return null;

  const solid = linePath(width, height, divisions, false);
  const dashed = linePath(width, height, divisions, true);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute"
      aria-hidden="true"
      focusable="false"
    >
      {/*
        같은 선을 두 번 그린다. 어두운 선을 굵게 깔고 그 위에 밝은 선을 얹으면
        흰 사진에서도 검은 사진에서도 읽힌다. 한 가지 색으로는 한쪽에서 사라진다.
      */}
      <g fill="none" strokeLinecap="round">
        {/* 3칸처럼 중심선이 없는 눈금도 있다. 빈 경로는 아예 그리지 않는다 */}
        {solid && (
          <>
            <path d={solid} stroke="rgba(0,0,0,0.28)" strokeWidth={2.5} />
            <path d={solid} stroke="rgba(255,255,255,0.75)" strokeWidth={1} />
          </>
        )}
        {dashed && (
          <>
            <path d={dashed} stroke="rgba(0,0,0,0.28)" strokeWidth={2.5} strokeDasharray="7 7" />
            <path d={dashed} stroke="rgba(255,255,255,0.8)" strokeWidth={1} strokeDasharray="7 7" />
          </>
        )}
      </g>
    </svg>
  );
}
