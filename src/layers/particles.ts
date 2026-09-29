import { createId } from '@/utils/id';
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

export type ParticleKind =
  | 'sparkle'
  | 'star'
  | 'heart'
  | 'bubble'
  | 'snow'
  | 'petal'
  | 'confetti'
  | 'note';

export interface ParticleShape {
  kind: ParticleKind;
  label: string;
  /** 24x24 좌표계의 경로. 아이콘과 같은 규격이라 눈대중이 서로 맞는다. */
  path: string;
  /** 선으로 그릴지. 비눗방울과 음표는 채우면 덩어리가 되어 무엇인지 읽히지 않는다. */
  stroke?: boolean;
  /** 한 벌에 뿌릴 개수. 종류마다 어울리는 밀도가 다르다. */
  count: number;
}

export const PARTICLE_SHAPES: readonly ParticleShape[] = [
  {
    kind: 'sparkle',
    label: '반짝이',
    path: 'M12 1c.7 5.6 4.7 9.6 10.3 10.3-5.6.7-9.6 4.7-10.3 10.3-.7-5.6-4.7-9.6-10.3-10.3C7.3 10.6 11.3 6.6 12 1z',
    count: 14,
  },
  {
    kind: 'star',
    label: '별가루',
    path: 'M12 1 14.7 8.28 22.46 8.6 16.37 13.42 18.46 20.9 12 16.6 5.54 20.9 7.63 13.42 1.54 8.6 9.3 8.28Z',
    count: 12,
  },
  {
    kind: 'heart',
    label: '하트비',
    path: 'M12 20.6C12 20.6 2.25 14.6 2.25 8.6 2.25 5.25 4.88 3 7.88 3c1.87 0 3.37.94 4.12 2.44C12.75 3.94 14.25 3 16.13 3 19.13 3 21.75 5.25 21.75 8.6c0 6-9.75 12-9.75 12z',
    count: 11,
  },
  {
    kind: 'bubble',
    label: '방울',
    path: 'M12 2.6a9.4 9.4 0 1 1 0 18.8 9.4 9.4 0 0 1 0-18.8z M8 7.6a4.6 4.6 0 0 0-1.7 2.6',
    stroke: true,
    count: 13,
  },
  {
    kind: 'snow',
    label: '눈',
    path: 'M12 1.5v21 M2.9 6.75l18.2 10.5 M2.9 17.25l18.2-10.5 M12 5.4 9.6 3 M12 5.4 14.4 3 M12 18.6l-2.4 2.4 M12 18.6l2.4 2.4',
    stroke: true,
    count: 16,
  },
  {
    kind: 'petal',
    label: '꽃잎',
    path: 'M12 1.8c-4.2 5.4-6.3 8.7-6.3 11.7a6.3 6.3 0 0 0 12.6 0c0-3-2.1-6.3-6.3-11.7z',
    count: 12,
  },
  {
    kind: 'confetti',
    label: '색종이',
    path: 'M3.4 8.6h17.2a2.6 2.6 0 0 1 2.6 2.6v1.6a2.6 2.6 0 0 1-2.6 2.6H3.4a2.6 2.6 0 0 1-2.6-2.6v-1.6a2.6 2.6 0 0 1 2.6-2.6z',
    count: 18,
  },
  {
    kind: 'note',
    label: '음표',
    path: 'M9.5 17.4V4.2l10-2.2v13.2 M9.5 17.4a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M19.5 15.2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    stroke: true,
    count: 10,
  },
];

export function findParticleShape(kind: ParticleKind): ParticleShape {
  // 목록에서 사라진 종류를 참조하는 예전 작업물도 열려야 한다
  return PARTICLE_SHAPES.find((shape) => shape.kind === kind) ?? (PARTICLE_SHAPES[0] as ParticleShape);
}

/** 파티클 한 벌이 차지하는 기준 크기. 도형(256)보다 크다. 여러 개를 흩뿌릴 자리가 필요하다. */
export const PARTICLE_BASE_SIZE = 512;

/** 새 파티클이 캔버스 가로폭에서 차지할 비율. 배경처럼 넓게 깔리는 것이 자연스럽다. */
export const PARTICLE_FILL_RATIO = 0.72;

/** 파티클 하나의 그림이 그려지는 좌표계 크기. */
const SHAPE_BOX = 24;

export interface ParticleDot {
  x: number;
  y: number;
  /** 한 변의 길이. 경로는 24 좌표계라 이 값에 맞춰 줄인다. */
  size: number;
  rotation: number;
  opacity: number;
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

/**
 * 흩뿌린 자리를 만든다.
 *
 * 완전한 난수로 뿌리면 한쪽에 뭉치고 다른 쪽이 비어서 "흩뿌렸다"기보다 "쏟았다"에 가까워진다.
 * 칸을 나눠 한 칸에 하나씩 두고 칸 안에서만 흔든다.
 */
export function scatterParticles(
  seed: number,
  count: number,
  width: number,
  height: number,
): ParticleDot[] {
  const random = randomFrom(seed);
  const columns = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.max(1, Math.ceil(count / columns));

  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const base = Math.min(width, height) * 0.16;

  const dots: ParticleDot[] = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);

    dots.push({
      // 칸 가운데에서 절반 칸만큼만 흔든다. 더 흔들면 옆 칸과 겹친다.
      x: (column + 0.5) * cellWidth + (random() - 0.5) * cellWidth * 0.8,
      y: (row + 0.5) * cellHeight + (random() - 0.5) * cellHeight * 0.8,
      size: base * (0.55 + random() * 0.95),
      rotation: random() * 360,
      // 전부 같은 진하기면 도장을 찍은 것처럼 보인다. 흐린 것이 섞여야 뿌려진 느낌이 난다.
      opacity: 0.5 + random() * 0.5,
      });
  }

  return dots;
}

/** 경로(24 좌표계)를 원하는 크기로 그릴 때의 배율. */
export function dotScale(size: number): number {
  return size / SHAPE_BOX;
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

  const scale = Math.min(
    (canvasWidth * PARTICLE_FILL_RATIO) / PARTICLE_BASE_SIZE,
    (canvasHeight * PARTICLE_FILL_RATIO) / PARTICLE_BASE_SIZE,
  );

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
    count: findParticleShape(kind).count,
  };
}
