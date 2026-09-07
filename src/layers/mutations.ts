import { createId } from '@/utils/id';
import { nextZIndex } from './order';
import type { BaseLayer, Layer, PhotoLayer, ShapeLayer, TextLayer } from './types';

/**
 * 레이어 배열을 다루는 순수 함수 모음.
 *
 * 스토어에 두지 않는 이유는 두 가지다.
 * 하나는 스토어 파일이 커지는 것을 막기 위해서고,
 * 다른 하나는 이 계산들이 테스트하기 쉬운 순수 함수여야 하기 때문이다(테스트 방침).
 */

/** 복제본이 원본에 완전히 겹치면 복제됐는지 알 수 없다. 대각선으로 조금 밀어 둔다(논리 좌표). */
const DUPLICATE_OFFSET = 40;

export function findLayer(layers: readonly Layer[], id: string): Layer | undefined {
  return layers.find((layer) => layer.id === id);
}

/**
 * 값이 하나도 안 바뀌는 패치인지 본다.
 * 손가락을 뗐지만 실제로는 움직이지 않은 경우까지 히스토리에 남으면
 * 실행취소를 눌러도 아무 변화가 없는 단계가 쌓인다.
 */
function isNoopPatch(layer: Layer, patch: Partial<Omit<BaseLayer, 'id' | 'type'>>): boolean {
  return Object.entries(patch).every(([key, value]) => layer[key as keyof Layer] === value);
}

/**
 * 모든 타입이 공통으로 갖는 속성만 패치한다.
 * Partial<Layer>로 받으면 사진 필드가 텍스트 레이어에 섞여 들어가도 타입이 막지 못한다.
 *
 * 바뀐 것이 없으면 같은 객체를 그대로 돌려준다. 호출부는 참조가 그대로인 것을 보고
 * 스토어 갱신과 히스토리 기록을 통째로 건너뛴다.
 */
export function patchBaseLayer(
  layers: readonly Layer[],
  id: string,
  patch: Partial<Omit<BaseLayer, 'id' | 'type'>>,
): Layer[] {
  return layers.map((layer) =>
    layer.id === id && !isNoopPatch(layer, patch) ? { ...layer, ...patch } : layer,
  );
}

/** 텍스트 전용 패치. 대상이 텍스트가 아니면 아무것도 하지 않는다. */
export function patchTextLayer(
  layers: readonly Layer[],
  id: string,
  patch: Partial<Omit<TextLayer, 'id' | 'type'>>,
): Layer[] {
  return layers.map((layer) =>
    layer.id === id && layer.type === 'text' ? { ...layer, ...patch } : layer,
  );
}

/** 도형 전용 패치. 대상이 도형이 아니면 아무것도 하지 않는다. */
export function patchShapeLayer(
  layers: readonly Layer[],
  id: string,
  patch: Partial<Omit<ShapeLayer, 'id' | 'type'>>,
): Layer[] {
  return layers.map((layer) =>
    layer.id === id && layer.type === 'shape' ? { ...layer, ...patch } : layer,
  );
}

/** 사진 전용 패치(보정, 테두리). 대상이 사진이 아니면 아무것도 하지 않는다. */
export function patchPhotoLayer(
  layers: readonly Layer[],
  id: string,
  patch: Partial<Omit<PhotoLayer, 'id' | 'type'>>,
): Layer[] {
  return layers.map((layer) =>
    layer.id === id && layer.type === 'photo' ? { ...layer, ...patch } : layer,
  );
}

export function removeLayerById(layers: readonly Layer[], id: string): Layer[] {
  return layers.filter((layer) => layer.id !== id);
}

export interface DuplicateResult {
  layers: Layer[];
  newId: string;
}

/**
 * 레이어를 복제한다. 사진과 낙서는 imageId를 그대로 공유한다.
 * 픽셀을 복사하면 IndexedDB가 두 배로 불어나는데, 이미지는 어차피 읽기 전용이라 공유해도 안전하다.
 */
export function duplicateLayerById(
  layers: readonly Layer[],
  id: string,
): DuplicateResult | null {
  const source = findLayer(layers, id);
  if (!source) return null;

  const copy: Layer = {
    ...source,
    id: createId(),
    x: source.x + DUPLICATE_OFFSET,
    y: source.y + DUPLICATE_OFFSET,
    zIndex: nextZIndex(layers),
  };

  return { layers: [...layers, copy], newId: copy.id };
}
