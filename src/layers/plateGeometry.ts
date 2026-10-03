import type { PlateBox, PlateGeometry } from './plateShapes';

/**
 * 문구 스티커 도형의 경로 조각들.
 *
 * 도형 목록(plateShapes)에서 떼어 낸 이유는 파일 길이다. 여기에는 특정 도형을 모르는
 * 기하 계산(다각형, 둥근 사각형, 둘레 다시 찍기, 방울 테두리)만 둔다.
 * 모든 경로는 시계 방향으로 돈다. 방울 테두리의 호가 바깥으로 부푸는 것이 그 방향에 기대고 있다.
 */

export type Pt = readonly [number, number];

export const fmt = (value: number): string => String(Math.round(value * 100) / 100);
export const pt = ([x, y]: Pt): string => `${fmt(x)} ${fmt(y)}`;
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function boxOf(points: readonly Pt[]): PlateBox {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export function centered(hw: number, hh: number): PlateBox {
  return { x: -hw, y: -hh, width: hw * 2, height: hh * 2 };
}

export function polygon(points: readonly Pt[]): string {
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'}${pt(point)}`).join('')}Z`;
}

/** 모서리를 깎은 다각형. 꼭짓점을 조절점 삼아 곡선으로 돌아 나가서 뾰족한 끝이 둥글어진다. */
export function roundedPolygon(points: readonly Pt[], cut: number): string {
  const n = points.length;
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const parts: string[] = [];
  points.forEach((point, index) => {
    const prev = points[(index - 1 + n) % n] ?? point;
    const next = points[(index + 1) % n] ?? point;
    const from = lerp(point, prev, cut);
    const to = lerp(point, next, cut);
    parts.push(`${index === 0 ? 'M' : 'L'}${pt(from)}Q${pt(point)} ${pt(to)}`);
  });
  return `${parts.join('')}Z`;
}

export function roundRect(hw: number, hh: number, r: number): string {
  const arc = `A${fmt(r)} ${fmt(r)} 0 0 1`;
  return (
    `M${fmt(-hw + r)} ${fmt(-hh)}H${fmt(hw - r)}${arc} ${fmt(hw)} ${fmt(-hh + r)}` +
    `V${fmt(hh - r)}${arc} ${fmt(hw - r)} ${fmt(hh)}H${fmt(-hw + r)}` +
    `${arc} ${fmt(-hw)} ${fmt(hh - r)}V${fmt(-hh + r)}${arc} ${fmt(-hw + r)} ${fmt(-hh)}Z`
  );
}

export function ellipse(rx: number, ry: number): string {
  const arc = `A${fmt(rx)} ${fmt(ry)} 0 1 1`;
  return `M${fmt(-rx)} 0${arc} ${fmt(rx)} 0${arc} ${fmt(-rx)} 0Z`;
}

/** 중심을 도는 꼭짓점. 첫 점이 위를 향하고 시계 방향으로 돈다. */
export function radial(count: number, rx: number, ry: number, radiusAt: (index: number) => number): Pt[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const radius = radiusAt(index);
    return [Math.cos(angle) * radius * rx, Math.sin(angle) * radius * ry] as const;
  });
}

/** 둥근 사각형 둘레를 시계 방향으로 따라가는 점들. 방울 모양 테두리의 뼈대다. */
export function roundRectContour(hw: number, hh: number, r: number): Pt[] {
  const corners: readonly [number, number, number][] = [
    [hw - r, -hh + r, -Math.PI / 2],
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
    [-hw + r, -hh + r, Math.PI],
  ];
  const steps = 10;
  const points: Pt[] = [];
  for (const [cx, cy, start] of corners) {
    for (let step = 0; step <= steps; step += 1) {
      const angle = start + (Math.PI / 2) * (step / steps);
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
  }
  return points;
}

/** 닫힌 꺾은선 위에 같은 간격으로 count개의 점을 다시 찍는다. */
export function resample(points: readonly Pt[], count: number): Pt[] {
  const n = points.length;
  const lengths: number[] = [];
  let total = 0;
  for (let index = 0; index < n; index += 1) {
    const a = points[index] ?? [0, 0];
    const b = points[(index + 1) % n] ?? a;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lengths.push(length);
    total += length;
  }

  const result: Pt[] = [];
  let segment = 0;
  let walked = 0;
  for (let k = 0; k < count; k += 1) {
    const target = (total * k) / count;
    while (segment < n - 1 && walked + (lengths[segment] ?? 0) < target) {
      walked += lengths[segment] ?? 0;
      segment += 1;
    }
    const a = points[segment] ?? [0, 0];
    const b = points[(segment + 1) % n] ?? a;
    const length = lengths[segment] || 1;
    const t = (target - walked) / length;
    result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return result;
}

/**
 * 뼈대의 점과 점 사이를 바깥으로 부푼 호로 잇는다(구름, 레이스).
 * 시계 방향으로 돌면서 sweep 1로 그리면 호가 언제나 바깥으로 부푼다.
 * 방울 크기를 문구 길이와 상관없이 일정하게 두려고 점의 개수를 둘레 길이로 정한다.
 */
export function bumpy(base: readonly Pt[], ratioAt: (index: number) => number): PlateGeometry {
  const n = base.length;
  const first = base[0] ?? [0, 0];
  let path = `M${pt(first)}`;
  let bulge = 0;
  for (let index = 0; index < n; index += 1) {
    const a = base[index] ?? first;
    const b = base[(index + 1) % n] ?? first;
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const radius = Math.max(chord / 2, chord * ratioAt(index));
    bulge = Math.max(bulge, radius - Math.sqrt(Math.max(0, radius * radius - (chord * chord) / 4)));
    path += `A${fmt(radius)} ${fmt(radius)} 0 0 1 ${pt(b)}`;
  }
  const box = boxOf(base);
  return {
    path: `${path}Z`,
    box: { x: box.x - bulge, y: box.y - bulge, width: box.width + bulge * 2, height: box.height + bulge * 2 },
  };
}

export function bumpyAround(hw: number, hh: number, radius: number, chord: number, ratioAt: (index: number) => number): PlateGeometry {
  const contour = roundRectContour(hw, hh, radius);
  const perimeter = 4 * (hw + hh) - (8 - 2 * Math.PI) * radius;
  return bumpy(resample(contour, Math.max(8, Math.round(perimeter / chord))), ratioAt);
}
