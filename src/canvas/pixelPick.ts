import Konva from 'konva';
import { SceneCanvas } from 'konva/lib/Canvas';
import type { Vector2d } from 'konva/lib/types';
import { BACKGROUND_NAME } from './BackgroundContent';
import { TEMPLATE_SLOT_NAME } from './TemplateSlotShape';
import { LAYER_NODE_NAME } from './useDragSnap';

/**
 * 눌린 자리에 실제로 그려진 요소를 찾는다.
 *
 * Konva의 히트 판정은 요소마다 사각형이라, 스티커와 낙서의 투명한 둘레가 아래 사진을 덮는다.
 * 그래서 겹친 곳을 누르면 언제나 맨 위의 사각형이 잡혔다. 알파 기준 히트(`drawHitFromCache`)는
 * 캐시 해상도에 화질이 묶여서 쓰지 않고, 누르는 순간에만 손가락 둘레를 요소별로 그려 본다.
 */

/** 손가락 끝의 반경(CSS 픽셀). 글자 획이나 가는 낙서는 정확히 짚을 수 없어서 이만큼 봐준다. */
const TOUCH_RADIUS = 12;
/** 파티클은 조각 사이가 대부분 비어 있어서 더 넉넉히 준다. */
const PARTICLE_RADIUS = 22;
/** 이보다 옅은 픽셀은 없는 것으로 본다. 흐린 그림자의 끝자락까지 잡히면 그림보다 크게 눌린다. */
const ALPHA_MIN = 32;

const PROBE_SIZE = PARTICLE_RADIUS * 2 + 1;

/** 판정용 캔버스는 하나만 두고 계속 쓴다. 누를 때마다 만들면 사파리가 캔버스 메모리를 늦게 거둔다. */
let probe: SceneCanvas | null = null;

function getProbe(): SceneCanvas {
  probe ??= new SceneCanvas({
    width: PROBE_SIZE,
    height: PROBE_SIZE,
    pixelRatio: 1,
    willReadFrequently: true,
  });
  return probe;
}

/**
 * 점에서 가장 가까운 불투명 픽셀까지의 거리. 반경 안에 없으면 Infinity.
 * 점은 스테이지 컨테이너 기준 좌표다. 노드의 절대 변환이 같은 기준이라 그대로 그리면 된다.
 */
function opaqueDistance(node: Konva.Node, point: Vector2d, radius: number): number {
  const canvas = getProbe();
  const context = canvas.getContext();
  const center = PARTICLE_RADIUS;

  context.clear();
  context.save();
  try {
    context.translate(center - point.x, center - point.y);
    node.drawScene(canvas);
  } catch {
    // 막 지워진 노드를 그리다 터질 수 있다. 없는 것으로 본다
    return Number.POSITIVE_INFINITY;
  } finally {
    context.restore();
  }

  let data: Uint8ClampedArray;
  try {
    data = context.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data;
  } catch {
    // 픽셀을 읽을 수 없으면(다른 출처의 그림) 사각형 판정과 같게 눌린 것으로 본다
    return 0;
  }

  // 투명도를 낮춘 요소는 픽셀도 옅다. 기준을 같이 낮춰야 흐리게 둔 요소도 고를 수 있다
  const alphaMin = Math.max(4, ALPHA_MIN * node.getAbsoluteOpacity());
  const limit = radius * radius;
  let best = Number.POSITIVE_INFINITY;
  for (let y = 0; y < PROBE_SIZE; y += 1) {
    const dy = y - center;
    if (dy * dy > limit) continue;
    for (let x = 0; x < PROBE_SIZE; x += 1) {
      const dx = x - center;
      const distance = dx * dx + dy * dy;
      if (distance > limit || distance >= best) continue;
      if ((data[(y * PROBE_SIZE + x) * 4 + 3] ?? 0) >= alphaMin) best = distance;
    }
  }
  return Math.sqrt(best);
}

/** 이벤트를 받을 도형. Konva는 도형에 이벤트를 쏘고 그룹으로 올려 보내므로 그룹 안의 도형 하나면 된다. */
function eventShape(node: Konva.Node): Konva.Shape | null {
  if (node instanceof Konva.Shape) return node.isListening() ? node : null;
  if (!(node instanceof Konva.Container)) return null;
  return (
    node.findOne<Konva.Shape>(
      (child: Konva.Node) => child instanceof Konva.Shape && Boolean(child.isListening()),
    ) ?? null
  );
}

function nearBox(node: Konva.Node, point: Vector2d, radius: number): boolean {
  const box = node.getClientRect();
  return (
    point.x >= box.x - radius &&
    point.x <= box.x + box.width + radius &&
    point.y >= box.y - radius &&
    point.y <= box.y + box.height + radius
  );
}

/** 돌린 요소도 제 사각형 안인지 본다. 화면 기준 외접 사각형은 돌린 만큼 커져서 쓰지 않는다. */
function insideOwnBox(node: Konva.Node, point: Vector2d): boolean {
  const local = node.getAbsoluteTransform().copy().invert().point(point);
  const box = node.getClientRect({ skipTransform: true });
  return (
    local.x >= box.x &&
    local.x <= box.x + box.width &&
    local.y >= box.y &&
    local.y <= box.y + box.height
  );
}

/**
 * 손가락 아래의 레이어를 위에서부터 찾는다.
 *
 * 1. 반경 안에 그림이 있는 가장 위 요소. 사진 위 스티커의 투명한 자리를 누르면 사진이 잡힌다.
 * 2. 그런 요소가 없으면 사각형 안을 누른 파티클. 조각 사이가 비어 있어도 고를 수 있어야 한다.
 *    사진 위에 뿌린 파티클은 1에서 사진이 먼저 잡히므로, 조각 가까이를 눌러야 파티클이 된다.
 */
function pickLayer(stage: Konva.Stage, point: Vector2d, isParticle: (id: string) => boolean) {
  // find는 그리는 순서(아래부터)로 돌려준다. 위에서부터 보려고 뒤집는다
  const nodes = stage
    .find(`.${LAYER_NODE_NAME}`)
    .filter((node) => node.isVisible() && Boolean(node.isListening()))
    .reverse();

  for (const node of nodes) {
    const radius = isParticle(node.id()) ? PARTICLE_RADIUS : TOUCH_RADIUS;
    if (!nearBox(node, point, radius)) continue;
    if (opaqueDistance(node, point, radius) > radius) continue;
    const shape = eventShape(node);
    if (shape) return shape;
  }

  for (const node of nodes) {
    if (!isParticle(node.id()) || !insideOwnBox(node, point)) continue;
    const shape = eventShape(node);
    if (shape) return shape;
  }
  return null;
}

/** 요소가 하나도 안 잡혔을 때 그 아래. 카드의 사진 자리, 아니면 배경이다. */
function pickBelowLayers(stage: Konva.Stage, point: Vector2d): Konva.Shape | null {
  const slots = stage.find(`.${TEMPLATE_SLOT_NAME}`).reverse();
  for (const slot of slots) {
    if (!nearBox(slot, point, 0) || opaqueDistance(slot, point, 0) > 0) continue;
    const shape = eventShape(slot);
    if (shape) return shape;
  }
  const background = stage.findOne(`.${BACKGROUND_NAME}`);
  return background ? eventShape(background) : null;
}

/**
 * 누른 자리의 도형을 다시 정한다. `hit`은 Konva가 사각형 히트로 찾은 것이다.
 *
 * Transformer 손잡이는 그대로 둔다. 선택 상자의 손잡이는 요소보다 위에 있고 눌려야 한다.
 * 사각형 히트가 요소가 아닌 것(카드, 배경)을 찾았는데 픽셀로도 요소가 없으면 그대로 쓴다.
 */
export function resolvePick(
  stage: Konva.Stage,
  hit: Konva.Shape | null,
  point: Vector2d,
  isParticle: (id: string) => boolean,
): Konva.Shape | null {
  if (hit?.findAncestor('Transformer')) return hit;

  const picked = pickLayer(stage, point, isParticle);
  if (picked) return picked;

  // 아무것도 듣지 않는 자리(그리기 중)이거나 요소가 아닌 것을 눌렀다
  if (!hit || !hit.findAncestor(`.${LAYER_NODE_NAME}`)) return hit;
  return pickBelowLayers(stage, point);
}
