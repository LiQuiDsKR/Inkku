import { createId } from '@/utils/id';
import { findParticleShape, type ParticleKind, type ParticleLayout, type ParticleShape } from './particleCatalog';
import type { ParticleGlyph } from './particleGlyphs';
import type { ParticleLayer } from './types';

/**
 * 파티클.
 *
 * 반짝이, 꽃잎, 색종이처럼 "여러 개가 흩뿌려진 한 벌"이다. 스티커처럼 그림 파일로 두지 않는다.
 * 파일로 만들면 흩뿌린 모양이 한 가지로 굳고, 확대하거나 내보낼 때 파일 해상도에 묶인다.
 * 좌표로 그리면 매번 다른 배치가 나오고 어느 크기에서도 또렷하다.
 *
 * 흩뿌린 자리는 저장하지 않고 seed 하나만 저장한다. 좌표를 전부 담으면 레이어 하나가
 * 수십 개의 점 목록이 되고, 실행취소 스냅샷도 그만큼 무거워진다.
 */

/** 파티클 한 벌이 차지하는 영역의 긴 변. 도형(256)보다 크다. 여러 개를 흩뿌릴 자리가 필요하다. */
export const PARTICLE_BASE_SIZE = 512;

/** 새 파티클이 캔버스에서 차지할 비율. 테두리는 캔버스 끝까지 둘러야 가운데가 빈다. */
const LAYOUT_FILL: Record<ParticleLayout, number> = { scatter: 0.72, frame: 1, burst: 0.85 };

/** 선으로 그리는 조각의 두께(24 좌표계 기준). 조각이 커져도 선의 인상은 같아야 한다. */
export const GLYPH_STROKE_WIDTH = 1.7;

/** 조각 하나의 그림이 그려지는 좌표계 크기. */
const GLYPH_BOX = 24;

const DEFAULT_SIZE: readonly [number, number] = [0.55, 1.5];
const DEFAULT_OPACITY: readonly [number, number] = [0.5, 1];

export interface ParticleArea {
  width: number;
  height: number;
}

/**
 * 흩뿌리는 영역. 긴 변이 기준 크기이고 캔버스와 같은 비율이다.
 * 예전 작업물에는 비율이 없어서 정사각형으로 둔다. 그래야 예전 배치가 그대로 그려진다.
 */
export function particleArea(aspect: number | undefined): ParticleArea {
  const ratio = aspect && aspect > 0 ? aspect : 1;
  return ratio >= 1
    ? { width: PARTICLE_BASE_SIZE, height: PARTICLE_BASE_SIZE / ratio }
    : { width: PARTICLE_BASE_SIZE * ratio, height: PARTICLE_BASE_SIZE };
}

export interface ParticleDot {
  x: number;
  y: number;
  /** 한 변의 길이. 경로는 24 좌표계라 이 값에 맞춰 줄인다. */
  size: number;
  rotation: number;
  opacity: number;
  glyph: ParticleGlyph;
  /** 팔레트가 있는 한 벌이면 이 조각의 색. 없으면 레이어의 색을 쓴다. */
  tint: string | null;
}

/**
 * 같은 seed면 언제나 같은 배치를 준다.
 *
 * Math.random을 쓰면 다시 그릴 때마다 흩뿌린 자리가 바뀌어서, 화면을 건드릴 때마다
 * 파티클이 춤을 춘다. 내보낸 그림과 편집 화면도 달라진다.
 */
function randomFrom(seed: number): () => number {
  let value = (seed || 1) >>> 0;
  return () => {
    // 선형 합동법. 품질이 좋을 필요는 없고 같은 값이 반복되지 않기만 하면 된다.
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

interface Spot {
  x: number;
  y: number;
  /** 조각이 향할 기본 각도(도). 터지는 배치에서는 바깥 방향이다. */
  heading: number;
}

type Placer = (index: number, random: () => number) => Spot;

/**
 * 완전한 난수로 뿌리면 한쪽에 뭉치고 다른 쪽이 비어서 "흩뿌렸다"기보다 "쏟았다"에 가까워진다.
 * 칸을 나눠 한 칸에 하나씩 두고 칸 안에서만 흔든다.
 */
function scatterPlacer(count: number, width: number, height: number): Placer {
  const columns = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  return (index, random) => ({
    // 칸 가운데에서 절반 칸만큼만 흔든다. 더 흔들면 옆 칸과 겹친다.
    x: ((index % columns) + 0.5) * cellWidth + (random() - 0.5) * cellWidth * 0.8,
    y: (Math.floor(index / columns) + 0.5) * cellHeight + (random() - 0.5) * cellHeight * 0.8,
    heading: 0,
  });
}

/** 가장자리 둘레를 같은 간격으로 나눠 두고 조금씩 흔든다. 가운데는 사진 자리라 비워 둔다. */
function framePlacer(count: number, width: number, height: number): Placer {
  const inset = Math.min(width, height) * 0.07;
  const innerWidth = width - inset * 2;
  const innerHeight = height - inset * 2;
  const perimeter = (innerWidth + innerHeight) * 2;

  const pointAt = (distance: number): [number, number] => {
    const d = ((distance % perimeter) + perimeter) % perimeter;
    if (d < innerWidth) return [inset + d, inset];
    if (d < innerWidth + innerHeight) return [width - inset, inset + d - innerWidth];
    if (d < innerWidth * 2 + innerHeight) {
      return [width - inset - (d - innerWidth - innerHeight), height - inset];
    }
    return [inset, height - inset - (d - innerWidth * 2 - innerHeight)];
  };

  return (index, random) => {
    const [x, y] = pointAt(((index + 0.5 + (random() - 0.5) * 0.7) / count) * perimeter);
    return {
      x: x + (random() - 0.5) * inset * 1.2,
      y: y + (random() - 0.5) * inset * 1.2,
      heading: 0,
    };
  };
}

/** 한가운데에서 바깥으로. 가까운 쪽이 성기게 보이지 않도록 반지름을 제곱근으로 뽑는다. */
function burstPlacer(count: number, width: number, height: number): Placer {
  const reach = (Math.min(width, height) / 2) * 0.92;

  return (index, random) => {
    const theta = ((index + (random() - 0.5) * 0.6) / count) * Math.PI * 2;
    const radius = reach * (0.25 + 0.75 * Math.sqrt(random()));
    return {
      x: width / 2 + Math.cos(theta) * radius,
      y: height / 2 + Math.sin(theta) * radius,
      // 조각은 위를 보고 그려져 있다. 90도를 더해야 바깥을 향한다
      heading: (theta * 180) / Math.PI + 90,
    };
  };
}

const PLACERS: Record<ParticleLayout, typeof scatterPlacer> = {
  scatter: scatterPlacer,
  frame: framePlacer,
  burst: burstPlacer,
};

function pick<T>(items: readonly T[], roll: number): T | null {
  return items[Math.floor(roll * items.length)] ?? items[0] ?? null;
}

/** 흩뿌린 자리를 만든다. */
export function scatterParticles(
  shape: ParticleShape,
  seed: number,
  count: number,
  area: ParticleArea,
): ParticleDot[] {
  // 자리와 크기는 예전과 같은 순서로 뽑는다. 순서가 바뀌면 저장된 파티클의 배치가 달라진다.
  // 조각과 색은 새로 생긴 값이라 따로 뽑는다.
  const random = randomFrom(seed);
  const extra = randomFrom(seed ^ 0x5bd1e995);

  const place = PLACERS[shape.layout ?? 'scatter'](count, area.width, area.height);
  // 넓이의 기하평균을 쓴다. 정사각형이면 예전 값(짧은 변)과 같고, 길쭉해도 조각이 작아지지 않는다.
  const base = Math.sqrt(area.width * area.height) * 0.16;
  const [sizeMin, sizeMax] = shape.size ?? DEFAULT_SIZE;
  const [opacityMin, opacityMax] = shape.opacity ?? DEFAULT_OPACITY;
  const spin = shape.spin ?? 180;
  const angle = shape.angle ?? 0;

  const dots: ParticleDot[] = [];
  for (let index = 0; index < count; index += 1) {
    const spot = place(index, random);
    const size = base * (sizeMin + random() * (sizeMax - sizeMin));
    const roll = random();
    const rotation = spin >= 180 ? roll * 360 : angle + spot.heading + (roll - 0.5) * 2 * spin;
    // 전부 같은 진하기면 도장을 찍은 것처럼 보인다. 흐린 것이 섞여야 뿌려진 느낌이 난다.
    const opacity = opacityMin + random() * (opacityMax - opacityMin);

    const glyph = pick(shape.glyphs, extra());
    const tint = shape.palette ? pick(shape.palette, extra()) : null;
    if (!glyph) continue;

    dots.push({ x: spot.x, y: spot.y, size, rotation, opacity, glyph, tint });
  }
  return dots;
}

/** 경로(24 좌표계)를 원하는 크기로 그릴 때의 배율. */
export function dotScale(size: number): number {
  return size / GLYPH_BOX;
}

export interface CreateParticleLayerParams {
  kind: ParticleKind;
  color: string;
  canvasWidth: number;
  canvasHeight: number;
  zIndex: number;
}

export function createParticleLayer(params: CreateParticleLayerParams): ParticleLayer {
  const { kind, color, canvasWidth, canvasHeight, zIndex } = params;
  const shape = findParticleShape(kind);
  const aspect = canvasWidth / canvasHeight;
  const area = particleArea(aspect);
  const fill = LAYOUT_FILL[shape.layout ?? 'scatter'];

  const scale = Math.min((canvasWidth * fill) / area.width, (canvasHeight * fill) / area.height);

  return {
    id: createId(),
    type: 'particle',
    // 넓게 깔리는 것이라 어긋내지 않고 한가운데 둔다. 겹쳐 넣어 밀도를 올리는 쓰임도 있다.
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
    opacity: 1,
    zIndex,
    kind,
    color,
    // 넣을 때마다 다른 배치가 나온다. 두 번 넣어 겹치면 밀도가 올라가는 것도 이 때문이다.
    seed: Math.floor(Math.random() * 100000) + 1,
    count: shape.count,
    aspect,
  };
}
