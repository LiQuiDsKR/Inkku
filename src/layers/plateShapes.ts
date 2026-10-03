import {
  boxOf,
  bumpyAround,
  centered,
  clamp,
  ellipse,
  fmt,
  polygon,
  pt,
  radial,
  roundRect,
  roundedPolygon,
  type Pt,
} from './plateGeometry';

/**
 * 문구 스티커 뒤에 까는 도형.
 *
 * 요소 패널의 도형(shapeCatalog)과 달리 정해진 크기가 없다. 글자 상자를 품도록 그때그때 경로를 만든다.
 * 256 정사각형 경로를 늘여 쓰면 둥근 모서리와 구름 방울이 문구 길이만큼 찌그러진다.
 *
 * 경로 문자열 하나를 캔버스와 패널 견본이 함께 그린다. 그래서 견본과 결과가 어긋나지 않는다.
 * 원점은 글자 상자의 한가운데다. 말풍선 꼬리나 하트처럼 무게가 한쪽으로 쏠린 도형은
 * 상자가 원점에서 비켜 서고, 글자는 언제나 원점에 남는다.
 */

export const PLATE_SHAPE_IDS = [
  'round',
  'pill',
  'rect',
  'ellipse',
  'circle',
  'bubble',
  'cloud',
  'scallop',
  'heart',
  'star',
  'burst',
  'ribbon',
  'tape',
] as const;

export type PlateShape = (typeof PLATE_SHAPE_IDS)[number];

export interface PlateBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlateGeometry {
  path: string;
  /** 도형이 차지하는 사각형. 테두리 두께는 들어 있지 않다. */
  box: PlateBox;
}

/** shapeStyle의 하트 경로를 [-1, 1] 상자로 옮긴 값. 바닥 끝에서 시작해 시계 방향으로 돈다. */
const HEART_CURVES: readonly (readonly [Pt, Pt, Pt])[] = [
  [[0, 1], [-1, 0.319], [-1, -0.362]],
  [[-1, -0.745], [-0.731, -1], [-0.423, -1]],
  [[-0.231, -1], [-0.077, -0.894], [0, -0.723]],
  [[0.077, -0.894], [0.231, -1], [0.423, -1]],
  [[0.731, -1], [1, -0.745], [1, -0.362]],
  [[1, 0.319], [0, 1], [0, 1]],
];

/** 하트에서 글자가 들어가는 띠. 볼록한 윗부분이라 상자 가운데보다 조금 위에 있다. */
const HEART_TEXT = { x: 0.8, y: 0.36, center: -0.2 };

function heart(hw: number, hh: number): PlateGeometry {
  const sx = hw / HEART_TEXT.x;
  const sy = hh / HEART_TEXT.y;
  const map = ([x, y]: Pt): Pt => [x * sx, (y - HEART_TEXT.center) * sy];
  const curves = HEART_CURVES.map((curve) => `C${curve.map((point) => pt(map(point))).join(' ')}`);
  return {
    path: `M${pt(map([0, 1]))}${curves.join('')}Z`,
    box: { x: -sx, y: (-1 - HEART_TEXT.center) * sy, width: sx * 2, height: sy * 2 },
  };
}

/**
 * 가로세로 비율을 묶는다. 별과 폭발은 문구 길이만큼 늘이면 무슨 모양인지 알아볼 수 없다.
 * 모자라는 쪽을 키우므로 글자는 언제나 안에 남는다.
 */
function limitAspect(rx: number, ry: number, min: number, max: number): [number, number] {
  if (rx / ry > max) return [rx, rx / max];
  if (rx / ry < min) return [ry * min, ry];
  return [rx, ry];
}

function star(hw: number, hh: number): PlateGeometry {
  // 안쪽 오각형에 글자가 들어간다. 팔 쪽으로 조금 넘치는 것까지 허용해야 별이 너무 커지지 않는다.
  const [rx, ry] = limitAspect(hw / 0.42, hh / 0.3, 0.85, 1.5);
  const points = radial(10, rx, ry, (index) => (index % 2 === 0 ? 1 : 0.5));
  return { path: roundedPolygon(points, 0.12), box: boxOf(points) };
}

/** 폭발 끝이 고르면 별처럼 보인다. 길이를 조금씩 흔들어 만화 효과음 느낌을 낸다. */
const BURST_SPIKES = [1, 0.9, 0.97, 0.88, 1, 0.93, 0.86];

function burst(hw: number, hh: number): PlateGeometry {
  const [rx, ry] = limitAspect(hw / 0.55, hh / 0.5, 0.7, 2.4);
  const points = radial(28, rx, ry, (index) =>
    index % 2 === 0 ? (BURST_SPIKES[(index / 2) % BURST_SPIKES.length] ?? 1) : 0.76,
  );
  return { path: polygon(points), box: boxOf(points) };
}

function bubble(hw: number, hh: number, em: number): PlateGeometry {
  const r = Math.min(hw, hh) * 0.6;
  // 꼬리 밑변은 아랫변의 곧은 구간 안에 둔다. 모서리 곡선에 걸치면 꼬리가 비틀려 보인다.
  const tailW = Math.min(clamp(hw * 0.32, em * 0.3, em * 0.62), (hw - r) * 1.6);
  const tailH = em * 0.42;
  const baseX = clamp(-hw * 0.42, -hw + r, hw - r - tailW);
  const tip: Pt = [baseX - tailW * 0.25, hh + tailH];
  const arc = `A${fmt(r)} ${fmt(r)} 0 0 1`;
  const path =
    `M${fmt(-hw + r)} ${fmt(-hh)}H${fmt(hw - r)}${arc} ${fmt(hw)} ${fmt(-hh + r)}` +
    `V${fmt(hh - r)}${arc} ${fmt(hw - r)} ${fmt(hh)}H${fmt(baseX + tailW)}` +
    `Q${fmt(baseX + tailW * 0.45)} ${fmt(hh + tailH * 0.45)} ${pt(tip)}` +
    `Q${fmt(baseX + tailW * 0.1)} ${fmt(hh + tailH * 0.3)} ${fmt(baseX)} ${fmt(hh)}` +
    `H${fmt(-hw + r)}${arc} ${fmt(-hw)} ${fmt(hh - r)}V${fmt(-hh + r)}${arc} ${fmt(-hw + r)} ${fmt(-hh)}Z`;
  const left = Math.min(-hw, tip[0]);
  return { path, box: { x: left, y: -hh, width: hw - left, height: hh * 2 + tailH } };
}

function ribbon(hw: number, hh: number, em: number): PlateGeometry {
  // 끝을 V자로 판다. 판 깊이만큼 띠를 늘여야 글자가 홈에 먹히지 않는다.
  const notch = Math.min(hh * 0.75, em * 0.5);
  const w = hw + notch;
  const points: Pt[] = [[-w, -hh], [w, -hh], [w - notch, 0], [w, hh], [-w, hh], [-w + notch, 0]];
  return { path: polygon(points), box: centered(w, hh) };
}

function tape(hw: number, hh: number, em: number): PlateGeometry {
  // 손으로 찢은 마스킹테이프. 양 끝만 톱니로 자른다.
  const w = hw + em * 0.06;
  const depth = em * 0.08;
  const teeth = Math.max(3, Math.round((hh * 2) / (em * 0.3)));
  const step = (hh * 2) / teeth;
  const points: Pt[] = [[-w + depth, -hh], [w - depth, -hh]];
  for (let index = 0; index < teeth; index += 1) {
    points.push([w, -hh + step * (index + 0.5)], [w - depth, -hh + step * (index + 1)]);
  }
  points.push([-w + depth, hh]);
  for (let index = 0; index < teeth - 1; index += 1) {
    points.push([-w, hh - step * (index + 0.5)], [-w + depth, hh - step * (index + 1)]);
  }
  points.push([-w, -hh + step * 0.5]);
  return { path: polygon(points), box: centered(w, hh) };
}

/** 구름 방울 크기를 조금씩 다르게 한다. 고르면 레이스처럼 보인다. */
const CLOUD_BUMPS = [0.62, 0.7, 0.58, 0.74, 0.64];

interface PlateDef {
  label: string;
  /**
   * 여백 배율. 도형 스스로 둘레에 빈 자리를 만드는 것(하트, 별, 원)은 여백을 덜 준다.
   * 같은 "보통"을 골라도 도형마다 비슷한 넉넉함으로 보이게 하는 값이다.
   */
  padScale: number;
  /** hw, hh는 여백까지 더한 글자 상자의 반폭과 반높이, em은 글자 크기다. */
  build: (hw: number, hh: number, em: number) => PlateGeometry;
}

/** Record로 두어 목록에 이름을 넣고 모양을 빠뜨리면 타입 단계에서 걸린다. */
const PLATES: Record<PlateShape, PlateDef> = {
  round: {
    label: '둥근 사각',
    padScale: 1,
    build: (hw, hh) => ({ path: roundRect(hw, hh, Math.min(hw, hh) * 0.55), box: centered(hw, hh) }),
  },
  pill: {
    label: '알약',
    padScale: 0.9,
    build: (hw, hh) => {
      // 양 끝 반원이 글자 모서리를 먹지 않도록 그만큼 길게 늘인다
      const w = hw + hh * 0.4;
      return { path: roundRect(w, hh, hh), box: centered(w, hh) };
    },
  },
  rect: {
    label: '사각',
    padScale: 1,
    build: (hw, hh) => ({ path: polygon([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]), box: centered(hw, hh) }),
  },
  ellipse: {
    label: '타원',
    padScale: 0.7,
    build: (hw, hh) => {
      // 사각형을 품는 가장 작은 타원은 반지름이 루트2배다. 글자 둘레에 여백이 있어 조금 덜 키운다.
      const rx = hw * 1.34;
      const ry = hh * 1.34;
      return { path: ellipse(rx, ry), box: centered(rx, ry) };
    },
  },
  circle: {
    label: '원',
    padScale: 0.6,
    build: (hw, hh) => {
      const r = Math.hypot(hw, hh) * 0.97;
      return { path: ellipse(r, r), box: centered(r, r) };
    },
  },
  bubble: { label: '말풍선', padScale: 1, build: bubble },
  cloud: {
    label: '구름',
    padScale: 0.7,
    build: (hw, hh, em) => {
      const w = hw + em * 0.1;
      const h = hh + em * 0.12;
      const chord = clamp(Math.min(w, h) * 0.75, em * 0.5, em * 1.1);
      return bumpyAround(w, h, Math.min(w, h) * 0.95, chord, (index) => CLOUD_BUMPS[index % CLOUD_BUMPS.length] ?? 0.62);
    },
  },
  scallop: {
    label: '레이스',
    padScale: 0.8,
    build: (hw, hh, em) => {
      const w = hw + em * 0.05;
      const h = hh + em * 0.05;
      return bumpyAround(w, h, Math.min(w, h) * 0.5, em * 0.34, () => 0.56);
    },
  },
  heart: { label: '하트', padScale: 0.5, build: (hw, hh) => heart(hw, hh) },
  star: { label: '별', padScale: 0.3, build: (hw, hh) => star(hw, hh) },
  burst: { label: '폭발', padScale: 0.5, build: (hw, hh) => burst(hw, hh) },
  ribbon: { label: '리본띠', padScale: 0.8, build: ribbon },
  tape: { label: '테이프', padScale: 0.8, build: tape },
};

export interface PlateEntry extends PlateDef {
  shape: PlateShape;
}

export const PLATE_SHAPES: readonly PlateEntry[] = PLATE_SHAPE_IDS.map((shape) => ({
  shape,
  ...PLATES[shape],
}));

/** 목록에서 사라진 이름을 가리키는 예전 작업물도 열려야 한다. 모르는 이름은 둥근 사각으로 그린다. */
export function findPlate(shape: string): PlateEntry {
  return PLATE_SHAPES.find((entry) => entry.shape === shape) ?? { shape: 'round', ...PLATES.round };
}
