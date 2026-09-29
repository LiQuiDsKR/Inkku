import { HEART_PATH, SHAPE_BASE_SIZE } from './shapeStyle';

/**
 * 도형 목록과 모양.
 *
 * 모든 도형을 256 정사각형 안의 경로 하나로 적는다. 캔버스(Konva Path)와 패널 견본(SVG path)이
 * 같은 문자열을 그리므로, 견본과 실제로 놓이는 모양이 어긋날 수 없다.
 * Konva 기본 도형(Circle, Star...)을 쓰면 견본을 따로 그려야 하고 그 둘이 조금씩 달라진다.
 *
 * 여러 조각을 합친 도형(구름, 꽃)은 조각을 전부 같은 방향(시계 방향)으로 돈다.
 * 채우기 규칙이 nonzero라 방향이 섞이면 겹친 자리가 구멍으로 뚫린다.
 * 반대로 고리처럼 구멍이 필요한 곳은 안쪽을 일부러 반대로 돈다.
 */

export const SHAPE_KIND_IDS = [
  'rect',
  'circle',
  'triangle',
  'star',
  'heart',
  'arrow',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
  'star6',
  'burst',
  'sparkle',
  'flower',
  'cloud',
  'crescent',
  'drop',
  'lightning',
  'cross',
  'xmark',
  'ring',
  'semicircle',
  'arch',
  'pill',
  'parallelogram',
] as const;

export type ShapeKind = (typeof SHAPE_KIND_IDS)[number];

type Point = readonly [number, number];

const C = SHAPE_BASE_SIZE / 2;

/** 경로 문자열이 불필요하게 길어지지 않도록 소수 둘째 자리에서 자른다. */
const fmt = (value: number): string => String(Math.round(value * 100) / 100);

function polygon(points: readonly Point[]): string {
  const body = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`);
  return `${body.join('')}Z`;
}

/**
 * 중심을 도는 꼭짓점. 첫 점이 위를 향한다.
 * Konva의 RegularPolygon, Star와 같은 규칙이라 예전에 놓은 삼각형과 별이 그대로 그려진다.
 */
function radialPoints(count: number, radiusAt: (index: number) => number, turn = 0): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2 + turn;
    const radius = radiusAt(index);
    return [C + Math.cos(angle) * radius, C + Math.sin(angle) * radius] as const;
  });
}

function circle(cx: number, cy: number, r: number, clockwise = true): string {
  const sweep = clockwise ? 1 : 0;
  const arc = `A${fmt(r)} ${fmt(r)} 0 1 ${sweep}`;
  return `M${fmt(cx - r)} ${fmt(cy)}${arc} ${fmt(cx + r)} ${fmt(cy)}${arc} ${fmt(cx - r)} ${fmt(cy)}Z`;
}

function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const arc = `A${fmt(r)} ${fmt(r)} 0 0 1`;
  return (
    `M${fmt(x + r)} ${fmt(y)}H${fmt(x + w - r)}${arc} ${fmt(x + w)} ${fmt(y + r)}` +
    `V${fmt(y + h - r)}${arc} ${fmt(x + w - r)} ${fmt(y + h)}H${fmt(x + r)}` +
    `${arc} ${fmt(x)} ${fmt(y + h - r)}V${fmt(y + r)}${arc} ${fmt(x + r)} ${fmt(y)}Z`
  );
}

function arcPoints(cx: number, cy: number, r: number, from: number, to: number): Point[] {
  const steps = 36;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  });
}

/**
 * 초승달. 큰 원에서 작은 원을 도려낸 모양이다.
 * 호 명령의 방향 플래그는 두 원의 배치가 바뀌면 틀리기 쉬워서, 교점을 계산해 점으로 이어 그린다.
 */
function crescent(): string {
  const [ox, oy, or] = [135, 128, 112];
  const [ix, iy, ir] = [183, 100, 96];
  const dx = ix - ox;
  const dy = iy - oy;
  const d = Math.hypot(dx, dy);
  const a = (or * or - ir * ir + d * d) / (2 * d);
  const h = Math.sqrt(or * or - a * a);
  const px = ox + (a * dx) / d;
  const py = oy + (a * dy) / d;
  const bottom: Point = [px - (h * dy) / d, py + (h * dx) / d];
  const top: Point = [px + (h * dy) / d, py - (h * dx) / d];

  const outerFrom = Math.atan2(bottom[1] - oy, bottom[0] - ox);
  const outerTo = Math.atan2(top[1] - oy, top[0] - ox) + Math.PI * 2;
  const innerFrom = Math.atan2(top[1] - iy, top[0] - ix) + Math.PI * 2;
  const innerTo = Math.atan2(bottom[1] - iy, bottom[0] - ix);

  return polygon([
    ...arcPoints(ox, oy, or, outerFrom, outerTo),
    ...arcPoints(ix, iy, ir, innerFrom, innerTo),
  ]);
}

function rotateAround(points: readonly Point[], degree: number): Point[] {
  const angle = (degree * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, y]) => [C + (x - C) * cos - (y - C) * sin, C + (x - C) * sin + (y - C) * cos]);
}

const CROSS_POINTS: readonly Point[] = [
  [88, 8], [168, 8], [168, 88], [248, 88], [248, 168], [168, 168],
  [168, 248], [88, 248], [88, 168], [8, 168], [8, 88], [88, 88],
];

const FLOWER_PETALS = radialPoints(5, () => 70).map(([x, y]) => circle(x, y + 7, 52));

interface ShapeDef {
  label: string;
  /** 256 정사각형 좌표계의 경로. 가운데(128, 128)를 회전축으로 쓴다. */
  path: string;
}

/** Record로 두어 SHAPE_KIND_IDS에 새 이름을 넣고 모양을 빠뜨리면 타입 단계에서 걸린다. */
const SHAPES: Record<ShapeKind, ShapeDef> = {
  rect: { label: '사각형', path: roundRect(0, 0, 256, 256, 20.48) },
  circle: { label: '원', path: circle(C, C, 128) },
  triangle: { label: '삼각형', path: polygon(radialPoints(3, () => 128)) },
  star: { label: '별', path: polygon(radialPoints(10, (i) => (i % 2 ? 56.32 : 128))) },
  heart: { label: '하트', path: HEART_PATH },
  arrow: {
    label: '화살표',
    path: polygon([[8, 100], [150, 100], [150, 48], [248, 128], [150, 208], [150, 156], [8, 156]]),
  },
  diamond: { label: '마름모', path: polygon([[128, 4], [236, 128], [128, 252], [20, 128]]) },
  pentagon: { label: '오각형', path: polygon(radialPoints(5, () => 128)) },
  hexagon: { label: '육각형', path: polygon(radialPoints(6, () => 128, Math.PI / 6)) },
  octagon: { label: '팔각형', path: polygon(radialPoints(8, () => 128, Math.PI / 8)) },
  star6: { label: '육각별', path: polygon(radialPoints(12, (i) => (i % 2 ? 74 : 128))) },
  burst: { label: '톱니', path: polygon(radialPoints(28, (i) => (i % 2 ? 102 : 128))) },
  sparkle: { label: '반짝', path: 'M128 0Q140 116 256 128Q140 140 128 256Q116 140 0 128Q116 116 128 0Z' },
  flower: { label: '꽃', path: [...FLOWER_PETALS, circle(C, C + 7, 46)].join('') },
  cloud: {
    label: '구름',
    path: [
      roundRect(24, 132, 208, 84, 42),
      circle(78, 140, 50),
      circle(128, 108, 70),
      circle(182, 130, 52),
    ].join(''),
  },
  crescent: { label: '달', path: crescent() },
  drop: { label: '물방울', path: 'M128 6C128 6 40 108 40 162A88 88 0 0 0 216 162C216 108 128 6 128 6Z' },
  lightning: {
    label: '번개',
    path: polygon([[156, 0], [56, 144], [120, 144], [92, 256], [200, 104], [136, 104], [176, 0]]),
  },
  cross: { label: '더하기', path: polygon(CROSS_POINTS) },
  xmark: { label: '엑스', path: polygon(rotateAround(CROSS_POINTS, 45)) },
  ring: { label: '고리', path: circle(C, C, 124) + circle(C, C, 70, false) },
  semicircle: { label: '반원', path: 'M8 188A120 120 0 0 1 248 188Z' },
  arch: { label: '아치', path: 'M40 236V108A88 88 0 0 1 216 108V236Z' },
  pill: { label: '알약', path: roundRect(8, 72, 240, 112, 56) },
  parallelogram: { label: '평행사변형', path: polygon([[72, 48], [248, 48], [184, 208], [8, 208]]) },
};

export interface ShapeEntry extends ShapeDef {
  kind: ShapeKind;
}

export const SHAPE_KINDS: readonly ShapeEntry[] = SHAPE_KIND_IDS.map((kind) => ({
  kind,
  ...SHAPES[kind],
}));

/** 목록에서 사라진 이름을 참조하는 예전 작업물도 열려야 한다. 모르는 이름은 사각형으로 그린다. */
export function findShape(kind: string): ShapeEntry {
  const known = SHAPE_KINDS.find((entry) => entry.kind === kind);
  return known ?? { kind: 'rect', ...SHAPES.rect };
}
