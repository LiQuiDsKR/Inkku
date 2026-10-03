import { ellipsize, measureTextWidth, type TextStyle } from './measureText';
import { fieldValue } from './types';
import type {
  TemplateRowItem,
  TemplateRowPart,
  TemplateRowTextItem,
  TemplateSpec,
} from './types';

/**
 * 한 줄 안의 자리 계산.
 *
 * 말풍선과 같은 생각이다. 스펙에 적힌 좌표가 아니라 글자 폭을 재서 자리를 정한다.
 * 캔버스와 썸네일이 각자 계산하면 두 그림의 줄이 달라지므로 여기 한 곳에 둔다.
 */

/** 글 항목의 높이 비율. Konva Text의 기본 줄높이와 같아야 세로 가운데가 맞는다. */
const TEXT_LINE = 1.2;

/** 말줄임으로 줄일 때 남겨 두는 최소 폭(글자 크기 대비). 이보다 줄이면 읽을 것이 없다. */
const MIN_TEXT_RATIO = 1.6;

export interface RowBox {
  item: TemplateRowItem;
  /** 글 항목이 실제로 그릴 문구. 말줄임이 적용된 뒤의 값이다. */
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RowLayout {
  items: RowBox[];
  width: number;
  height: number;
}

/** 폰트 id를 실제 family 문자열로 바꾸는 함수. 캔버스와 썸네일이 각자 아는 값을 넘긴다. */
export type FamilyResolver = (fontId?: string) => string;

function itemText(
  item: TemplateRowTextItem,
  spec: TemplateSpec,
  fields: Readonly<Record<string, string>>,
): string {
  return item.field ? fieldValue(spec, fields, item.field) : (item.text ?? '');
}

function textStyle(item: TemplateRowTextItem, family: FamilyResolver): TextStyle {
  return { size: item.size, family: family(item.fontId), weight: item.weight };
}

interface Entry {
  item: TemplateRowItem;
  text: string;
  width: number;
  height: number;
  gap: number;
}

export function layoutRow(
  part: TemplateRowPart,
  spec: TemplateSpec,
  fields: Readonly<Record<string, string>>,
  family: FamilyResolver,
): RowLayout {
  const entries: Entry[] = [];

  for (const item of part.items) {
    if (item.kind === 'icon') {
      entries.push({ item, text: '', width: item.size, height: item.size, gap: item.gap ?? part.gap });
      continue;
    }

    const text = itemText(item, spec, fields);
    // 빈 값은 자리도 간격도 차지하지 않는다. 지운 칸만큼 줄에 구멍이 남으면 지운 티가 난다.
    if (!text) continue;

    entries.push({
      item,
      text,
      width: measureTextWidth(text, textStyle(item, family)),
      height: item.size * TEXT_LINE,
      gap: item.gap ?? part.gap,
    });
  }

  if (entries.length === 0) {
    return { items: [], width: 0, height: 0 };
  }

  // 첫 항목 앞에는 간격이 없다
  const gaps = entries.slice(1).reduce((sum, entry) => sum + entry.gap, 0);
  const content = entries.reduce((sum, entry) => sum + entry.width, 0);
  const overflow = content + gaps - part.maxWidth;

  if (overflow > 0) shrinkWidest(entries, overflow, family);

  const total = entries.reduce((sum, entry) => sum + entry.width, 0) + gaps;
  const height = entries.reduce((max, entry) => Math.max(max, entry.height), 0);

  const start =
    part.align === 'right' ? part.x - total : part.align === 'center' ? part.x - total / 2 : part.x;

  const items: RowBox[] = [];
  let cursor = start;

  for (const [index, entry] of entries.entries()) {
    if (index > 0) cursor += entry.gap;
    items.push({
      item: entry.item,
      text: entry.text,
      x: cursor,
      // 크기가 섞인 줄에서도 눈높이가 맞도록 세로 가운데로 모은다
      y: part.y + (height - entry.height) / 2,
      width: entry.width,
      height: entry.height,
    });
    cursor += entry.width;
  }

  return { items, width: total, height };
}

/**
 * 넘친 만큼 가장 긴 글을 줄인다.
 *
 * 모두를 조금씩 줄이지 않는 이유는, 짧은 항목(평점, 시각)은 줄일 여지가 없는데도
 * 같이 깎여서 읽을 수 없게 되기 때문이다. 길어서 넘치게 만든 쪽이 줄어드는 것이 자연스럽다.
 */
function shrinkWidest(entries: Entry[], overflow: number, family: FamilyResolver): void {
  let remaining = overflow;

  while (remaining > 0) {
    let target: Entry | null = null;
    for (const entry of entries) {
      if (entry.item.kind !== 'text') continue;
      const floor = entry.item.size * MIN_TEXT_RATIO;
      if (entry.width <= floor) continue;
      if (!target || entry.width > target.width) target = entry;
    }

    // 더 줄일 글이 없으면 그대로 둔다. 읽을 수 없게 만드는 것보다 조금 넘치는 편이 낫다.
    if (!target || target.item.kind !== 'text') return;

    const floor = target.item.size * MIN_TEXT_RATIO;
    const next = Math.max(floor, target.width - remaining);
    const style = textStyle(target.item, family);

    target.text = ellipsize(target.text, style, next);
    const measured = measureTextWidth(target.text, style);
    remaining -= target.width - measured;
    target.width = measured;
  }
}
