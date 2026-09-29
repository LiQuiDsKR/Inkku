import { GLYPHS, type ParticleGlyph } from './particleGlyphs';

/**
 * 파티클 한 벌의 목록.
 *
 * 한 벌은 "어떤 조각을, 몇 개, 어떻게 뿌리는가"다. 조각 모양은 `particleGlyphs`가,
 * 흩뿌리는 계산은 `particles`가 갖고, 여기에는 그 둘을 고르는 값만 둔다.
 * 새 파티클을 넣는 일은 이 파일에 한 줄을 더하는 일이어야 한다.
 */

export const PARTICLE_KIND_IDS = [
  'sparkle', 'star', 'heart', 'bubble', 'snow', 'petal', 'confetti', 'note',
  'glitter', 'dust', 'bokeh', 'twinkle', 'y2k', 'heartLine', 'starLine',
  'blossom', 'daisy', 'leaf', 'clover', 'rain', 'raindrop', 'moon', 'lightning',
  'butterfly', 'bow', 'gem', 'cloud', 'paw', 'smile',
  'sprinkle', 'party', 'rainbow', 'memphis',
  'frameStar', 'frameHeart', 'frameFlower', 'firework', 'starBurst',
] as const;

export type ParticleKind = (typeof PARTICLE_KIND_IDS)[number];

/**
 * 뿌리는 방식.
 * scatter는 고르게 흩뿌린다. frame은 가장자리에만 둘러 가운데 사진을 비워 둔다.
 * burst는 한가운데에서 바깥으로 터져 나가고, 조각이 바깥을 향해 돈다.
 */
export type ParticleLayout = 'scatter' | 'frame' | 'burst';

interface ParticleDef {
  label: string;
  /** 한 벌에 섞을 조각. 같은 조각을 두 번 넣으면 그만큼 자주 나온다. */
  glyphs: readonly ParticleGlyph[];
  /** 한 벌에 뿌릴 개수. 종류마다 어울리는 밀도가 다르다. */
  count: number;
  layout?: ParticleLayout;
  /** 조각 크기 범위. 기준 크기에 곱하는 배율이다. */
  size?: readonly [number, number];
  opacity?: readonly [number, number];
  /**
   * 기본 각도에서 흔들 수 있는 폭(도). 180이면 아무 방향이나 된다.
   * 하트나 나비는 거꾸로 서면 어색하고, 빗줄기는 전부 같은 방향이어야 비로 읽힌다.
   */
  spin?: number;
  angle?: number;
  /**
   * 조각마다 이 중에서 색을 뽑는다. 있으면 고른 색을 쓰지 않는다.
   * 색종이와 스프링클은 한 가지 색이면 그 느낌이 안 난다.
   */
  palette?: readonly string[];
}

const RAINBOW = ['#ff5470', '#ff922b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
const PARTY = ['#ff5470', '#ffd43b', '#4dabf7', '#69db7c', '#ffffff'];
const PASTEL = ['#ffc9d6', '#ffe3a3', '#c3f0ca', '#bde0fe', '#e2d1ff'];

const G = GLYPHS;

const PARTICLES: Record<ParticleKind, ParticleDef> = {
  sparkle: { label: '반짝이', glyphs: [G.sparkle], count: 14 },
  star: { label: '별가루', glyphs: [G.star], count: 12 },
  heart: { label: '하트비', glyphs: [G.heart], count: 11 },
  bubble: { label: '방울', glyphs: [G.bubble], count: 13 },
  snow: { label: '눈', glyphs: [G.snowflake], count: 16 },
  petal: { label: '꽃잎', glyphs: [G.petal], count: 12 },
  confetti: { label: '색종이', glyphs: [G.confetti], count: 18 },
  note: { label: '음표', glyphs: [G.note], count: 10 },

  glitter: { label: '글리터', glyphs: [G.twinkle, G.dot, G.dot], count: 30, size: [0.15, 0.8], spin: 0 },
  dust: { label: '금가루', glyphs: [G.dot], count: 80, size: [0.05, 0.2], opacity: [0.35, 1] },
  bokeh: { label: '보케', glyphs: [G.bigDot], count: 9, size: [1.3, 2.8], opacity: [0.12, 0.38] },
  twinkle: { label: '트윙클', glyphs: [G.twinkle], count: 12, size: [0.4, 1.5], spin: 0 },
  y2k: { label: 'Y2K', glyphs: [G.twinkle, G.plus, G.ring, G.dot], count: 18, size: [0.35, 1.1], spin: 0 },
  heartLine: { label: '하트 선', glyphs: [G.heartLine], count: 11, spin: 30 },
  starLine: { label: '별 선', glyphs: [G.starLine], count: 12, spin: 40 },

  blossom: { label: '벚꽃', glyphs: [G.blossom, G.blossom, G.petal], count: 14 },
  daisy: { label: '데이지', glyphs: [G.daisy], count: 10, spin: 40 },
  leaf: { label: '나뭇잎', glyphs: [G.leaf], count: 12 },
  clover: { label: '클로버', glyphs: [G.clover], count: 11 },
  rain: {
    label: '빗줄기',
    glyphs: [G.ray],
    count: 44,
    size: [0.4, 1],
    opacity: [0.3, 0.75],
    spin: 0,
    angle: 18,
  },
  raindrop: { label: '빗방울', glyphs: [G.raindrop], count: 16, spin: 10 },
  moon: { label: '달밤', glyphs: [G.crescent, G.star, G.dot], count: 14, size: [0.3, 1.3], spin: 25 },
  lightning: { label: '번개', glyphs: [G.lightning], count: 9, spin: 25 },

  butterfly: { label: '나비', glyphs: [G.butterfly], count: 8, spin: 35 },
  bow: { label: '리본', glyphs: [G.bow], count: 9, spin: 25 },
  gem: { label: '보석', glyphs: [G.gem], count: 10, spin: 25 },
  cloud: { label: '구름', glyphs: [G.cloud], count: 7, size: [0.9, 1.9], opacity: [0.6, 1], spin: 0 },
  paw: { label: '발자국', glyphs: [G.paw], count: 10, spin: 40 },
  smile: { label: '스마일', glyphs: [G.smile], count: 10, spin: 30 },

  sprinkle: {
    label: '스프링클',
    glyphs: [G.sprinkle],
    count: 36,
    size: [0.28, 0.55],
    opacity: [0.85, 1],
    palette: RAINBOW,
  },
  party: {
    label: '파티',
    glyphs: [G.confetti, G.dot, G.squiggle, G.triangle],
    count: 28,
    size: [0.35, 1],
    opacity: [0.8, 1],
    palette: PARTY,
  },
  rainbow: { label: '무지개', glyphs: [G.confetti, G.dot], count: 24, opacity: [0.8, 1], palette: RAINBOW },
  memphis: {
    label: '멤피스',
    glyphs: [G.squiggle, G.zigzag, G.triangleLine, G.ring, G.dot],
    count: 16,
    opacity: [0.85, 1],
    palette: PASTEL,
  },

  frameStar: {
    label: '별 테두리',
    glyphs: [G.star, G.twinkle, G.dot],
    count: 30,
    layout: 'frame',
    size: [0.25, 0.75],
  },
  frameHeart: { label: '하트 테두리', glyphs: [G.heart], count: 24, layout: 'frame', size: [0.3, 0.8], spin: 30 },
  frameFlower: {
    label: '꽃 테두리',
    glyphs: [G.daisy, G.blossom, G.dot],
    count: 26,
    layout: 'frame',
    size: [0.3, 0.8],
  },
  firework: { label: '폭죽', glyphs: [G.ray], count: 26, layout: 'burst', size: [0.5, 1.1], spin: 0 },
  starBurst: {
    label: '별 터짐',
    glyphs: [G.star, G.twinkle, G.dot],
    count: 22,
    layout: 'burst',
    size: [0.25, 0.9],
  },
};

export interface ParticleShape extends ParticleDef {
  kind: ParticleKind;
}

export const PARTICLE_SHAPES: readonly ParticleShape[] = PARTICLE_KIND_IDS.map((kind) => ({
  kind,
  ...PARTICLES[kind],
}));

export function findParticleShape(kind: string): ParticleShape {
  // 목록에서 사라진 종류를 참조하는 예전 작업물도 열려야 한다
  const known = PARTICLE_SHAPES.find((shape) => shape.kind === kind);
  return known ?? { kind: 'sparkle', ...PARTICLES.sparkle };
}
