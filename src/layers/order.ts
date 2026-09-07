import type { Layer } from './types';

/**
 * 순서 변경은 zIndex 숫자를 직접 더하고 빼지 않는다.
 * 삽입과 삭제가 반복되면 숫자에 구멍이 생기고, 같은 값이 겹치면 순서가 비결정적이 된다.
 * 배열에서 자리를 옮긴 뒤 0부터 다시 매기는 편이 항상 예측 가능하다.
 */
export type ReorderCommand = 'forward' | 'backward' | 'front' | 'back';

export function sortByZIndex(layers: readonly Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

/** 정렬된 배열의 위치를 그대로 zIndex로 굳힌다. 값이 같으면 객체를 새로 만들지 않아 불필요한 리렌더를 줄인다. */
export function normalizeZIndex(sorted: readonly Layer[]): Layer[] {
  return sorted.map((layer, index) => (layer.zIndex === index ? layer : { ...layer, zIndex: index }));
}

function moveItem(items: readonly Layer[], from: number, to: number): Layer[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  // noUncheckedIndexedAccess 때문에 splice 결과가 undefined일 수 있다고 본다. 호출부에서 범위를 보장하지만 방어한다.
  if (!moved) return next;
  next.splice(to, 0, moved);
  return next;
}

/** 대상 레이어를 한 칸/끝으로 옮긴 새 배열. 대상이 없으면 원본을 그대로 돌려준다. */
export function reorderLayers(
  layers: readonly Layer[],
  id: string,
  command: ReorderCommand,
): Layer[] {
  const sorted = sortByZIndex(layers);
  const index = sorted.findIndex((layer) => layer.id === id);
  if (index < 0) return sorted;

  const last = sorted.length - 1;
  const target =
    command === 'forward'
      ? Math.min(last, index + 1)
      : command === 'backward'
        ? Math.max(0, index - 1)
        : command === 'front'
          ? last
          : 0;

  if (target === index) return normalizeZIndex(sorted);
  return normalizeZIndex(moveItem(sorted, index, target));
}

/** 새 레이어가 항상 맨 위로 오도록 다음 zIndex를 계산한다. */
export function nextZIndex(layers: readonly Layer[]): number {
  if (layers.length === 0) return 0;
  return Math.max(...layers.map((layer) => layer.zIndex)) + 1;
}
