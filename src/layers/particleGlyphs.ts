/**
 * 파티클 조각 하나하나의 모양.
 *
 * 전부 24x24 좌표계의 경로다. 아이콘과 같은 규격이라 눈대중이 서로 맞고,
 * 가운데(12, 12)를 회전축으로 쓴다. 한 벌(`particleCatalog`)은 이 조각들을 골라 섞는다.
 */

export interface ParticleGlyph {
  path: string;
  /** 선으로 그릴지. 비눗방울이나 음표는 채우면 덩어리가 되어 무엇인지 읽히지 않는다. */
  stroke?: boolean;
}

type Point = readonly [number, number];
type Segment = readonly ['M' | 'L', Point] | readonly ['C', Point, Point, Point] | readonly ['Z'];

const fmt = (value: number): string => String(Math.round(value * 100) / 100);

function circle(cx: number, cy: number, r: number): string {
  const arc = `A${fmt(r)} ${fmt(r)} 0 1 1`;
  return `M${fmt(cx - r)} ${fmt(cy)}${arc} ${fmt(cx + r)} ${fmt(cy)}${arc} ${fmt(cx - r)} ${fmt(cy)}Z`;
}

function rotate([x, y]: Point, degree: number): Point {
  const angle = (degree * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [12 + (x - 12) * cos - (y - 12) * sin, 12 + (x - 12) * sin + (y - 12) * cos];
}

/** 꽃잎 하나를 적어 두고 돌려 가며 찍는다. 꽃잎 다섯 장을 좌표로 따로 적으면 고칠 때 다섯 번 고친다. */
function radialCopies(segments: readonly Segment[], copies: number): string {
  const out: string[] = [];
  for (let copy = 0; copy < copies; copy += 1) {
    const degree = (360 / copies) * copy;
    for (const segment of segments) {
      if (segment[0] === 'Z') out.push('Z');
      else if (segment[0] === 'C') {
        const points = [segment[1], segment[2], segment[3]].map((point) => rotate(point, degree));
        out.push(`C${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(' ')}`);
      } else {
        const [x, y] = rotate(segment[1], degree);
        out.push(`${segment[0]}${fmt(x)} ${fmt(y)}`);
      }
    }
  }
  return out.join('');
}

const STAR_PATH =
  'M12 1 14.7 8.28 22.46 8.6 16.37 13.42 18.46 20.9 12 16.6 5.54 20.9 7.63 13.42 1.54 8.6 9.3 8.28Z';
const HEART_PATH =
  'M12 20.6C12 20.6 2.25 14.6 2.25 8.6 2.25 5.25 4.88 3 7.88 3c1.87 0 3.37.94 4.12 2.44C12.75 3.94 14.25 3 16.13 3 19.13 3 21.75 5.25 21.75 8.6c0 6-9.75 12-9.75 12z';

const BLOSSOM_PETAL: readonly Segment[] = [
  ['M', [12, 12]],
  ['C', [8.6, 9.6], [7.6, 5.2], [9.6, 2.2]],
  // 끝이 살짝 파인 것이 벚꽃이다. 둥글게 끝내면 그냥 꽃이 된다
  ['L', [12, 3.8]],
  ['L', [14.4, 2.2]],
  ['C', [16.4, 5.2], [15.4, 9.6], [12, 12]],
  ['Z'],
];

const DAISY = [
  ...Array.from({ length: 8 }, (_, index) => {
    const [x, y] = rotate([12, 5], index * 45);
    return circle(x, y, 3.2);
  }),
  circle(12, 12, 3.4),
].join('');

const CLOVER = [45, 135, 225, 315]
  .map((degree) => {
    const [x, y] = rotate([12, 7], degree);
    return circle(x, y, 5);
  })
  .join('');

const PAW = [
  'M12 12.5c-3.2 0-6.5 3.8-6.5 6.5 0 1.9 1.6 2.8 3.2 2.8 1.3 0 2.2-.7 3.3-.7s2 .7 3.3.7c1.6 0 3.2-.9 3.2-2.8 0-2.7-3.3-6.5-6.5-6.5z',
  circle(4.6, 10.4, 2.3),
  circle(8.6, 5.6, 2.4),
  circle(15.4, 5.6, 2.4),
  circle(19.4, 10.4, 2.3),
].join('');

export const GLYPHS = {
  sparkle: {
    path: 'M12 1c.7 5.6 4.7 9.6 10.3 10.3-5.6.7-9.6 4.7-10.3 10.3-.7-5.6-4.7-9.6-10.3-10.3C7.3 10.6 11.3 6.6 12 1z',
  },
  twinkle: { path: 'M12 0Q13 11 24 12Q13 13 12 24Q11 13 0 12Q11 11 12 0Z' },
  star: { path: STAR_PATH },
  starLine: { path: STAR_PATH, stroke: true },
  heart: { path: HEART_PATH },
  heartLine: { path: HEART_PATH, stroke: true },
  bubble: { path: 'M12 2.6a9.4 9.4 0 1 1 0 18.8 9.4 9.4 0 0 1 0-18.8z M8 7.6a4.6 4.6 0 0 0-1.7 2.6', stroke: true },
  snowflake: {
    path: 'M12 1.5v21 M2.9 6.75l18.2 10.5 M2.9 17.25l18.2-10.5 M12 5.4 9.6 3 M12 5.4 14.4 3 M12 18.6l-2.4 2.4 M12 18.6l2.4 2.4',
    stroke: true,
  },
  petal: { path: 'M12 1.8c-4.2 5.4-6.3 8.7-6.3 11.7a6.3 6.3 0 0 0 12.6 0c0-3-2.1-6.3-6.3-11.7z' },
  confetti: {
    path: 'M3.4 8.6h17.2a2.6 2.6 0 0 1 2.6 2.6v1.6a2.6 2.6 0 0 1-2.6 2.6H3.4a2.6 2.6 0 0 1-2.6-2.6v-1.6a2.6 2.6 0 0 1 2.6-2.6z',
  },
  note: {
    path: 'M9.5 17.4V4.2l10-2.2v13.2 M9.5 17.4a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M19.5 15.2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    stroke: true,
  },
  dot: { path: circle(12, 12, 5) },
  bigDot: { path: circle(12, 12, 11) },
  ring: { path: circle(12, 12, 8), stroke: true },
  plus: { path: 'M12 4v16M4 12h16', stroke: true },
  ray: { path: 'M12 4v16', stroke: true },
  sprinkle: { path: 'M9 5a3 3 0 0 1 6 0v14a3 3 0 0 1-6 0z' },
  raindrop: { path: 'M12 1C12 1 5 10 5 15a7 7 0 0 0 14 0C19 10 12 1 12 1z' },
  // 양끝이 뾰족해야 잎이다. 한쪽이 둥글면 달걀이나 꽃잎으로 읽힌다
  leaf: { path: 'M21 3C9 3 3 9 3 21c12 0 18-6 18-18z' },
  blossom: { path: radialCopies(BLOSSOM_PETAL, 5) },
  daisy: { path: DAISY },
  clover: { path: CLOVER },
  crescent: { path: 'M16 2.5A10 10 0 1 0 21.5 17A8 8 0 0 1 16 2.5Z' },
  lightning: { path: 'M14 1 4 14h7l-2 9 11-14h-7l3-8z' },
  butterfly: {
    path: 'M12 8C10 3 3 1 2 5c-1 3 1 6 5 7-3 1-4 4-2 6s5 0 7-4c2 4 5 6 7 4s1-5-2-6c4-1 6-4 5-7-1-4-8-2-10 3z',
  },
  bow: { path: 'M12 10C9 5 2 4 2 8.5v5C2 18 9 17 12 12c3 5 10 6 10 1.5v-5C22 4 15 5 12 10z' },
  gem: { path: 'M6 3h12l4 6-10 13L2 9z M2 9h20 M9 3 7.5 9 12 22 16.5 9 15 3', stroke: true },
  cloud: { path: 'M6.5 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.5 8.5a5.5 5.5 0 0 1 .5 10.5z' },
  squiggle: { path: 'M2 14c2.5-4 5-4 6.7 0s4.2 4 6.6 0 5-4 6.7 0', stroke: true },
  zigzag: { path: 'M2 15l4-6 4 6 4-6 4 6 4-6', stroke: true },
  triangle: { path: 'M12 3 22 20H2z' },
  triangleLine: { path: 'M12 4 21 19H3z', stroke: true },
  paw: { path: PAW },
  smile: {
    path: `${circle(12, 12, 10)}M8 14.5c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1M9 9.2v.6M15 9.2v.6`,
    stroke: true,
  },
} satisfies Record<string, ParticleGlyph>;
