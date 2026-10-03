import { BLOG_TEMPLATE } from './blog';
import { CHAT_TEMPLATE } from './chat';
import { DIARY_TEMPLATE } from './diary';
import { MAP_TEMPLATE } from './map';
import { MUSIC_TEMPLATE } from './music';
import { POLAROID_TEMPLATE } from './polaroid';
import type { TemplateSpec, TemplateVariant } from './types';

/**
 * 템플릿 목록.
 *
 * 컴포넌트가 개별 스펙 파일을 직접 import하지 않게 여기서만 모은다.
 * 새 카드를 넣는 일이 "파일 하나를 쓰고 이 배열에 한 줄을 더하는 일"로 끝나야 한다.
 */
export const TEMPLATE_SPECS: readonly TemplateSpec[] = [
  MAP_TEMPLATE,
  BLOG_TEMPLATE,
  MUSIC_TEMPLATE,
  POLAROID_TEMPLATE,
  CHAT_TEMPLATE,
  DIARY_TEMPLATE,
];

/** 스펙에서 사라진 템플릿을 참조하는 예전 작업물도 열려야 한다. 없으면 그리지 않는다. */
export function findTemplate(id: string): TemplateSpec | null {
  return TEMPLATE_SPECS.find((spec) => spec.id === id) ?? null;
}

/** 변형은 없어져도 카드 자체는 살린다. 첫 변형으로 떨어뜨려 그리는 쪽이 빈 화면보다 낫다. */
export function findVariant(spec: TemplateSpec, id: string): TemplateVariant | null {
  return spec.variants.find((variant) => variant.id === id) ?? spec.variants[0] ?? null;
}

/**
 * 처음 놓을 때 채워 넣을 값.
 *
 * 기본값을 레이어에 복사해 둔다. 스펙을 매번 찾아 읽게 하면
 * 사용자가 고친 값과 기본값을 구분할 수 없어 "되돌리기"의 기준이 사라진다.
 */
export function defaultFields(spec: TemplateSpec): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const field of spec.fields) fields[field.id] = field.value;
  return fields;
}

/**
 * 카드가 쓰는 앱 폰트 id 목록.
 * 캔버스는 폰트가 오기 전에 그리면 폴백으로 굳으므로, 그리기 전에 이것들을 받아 둬야 한다.
 */
export function collectFontIds(spec: TemplateSpec): string[] {
  const ids = new Set<string>();

  for (const part of spec.parts) {
    if ((part.kind === 'text' || part.kind === 'cells') && part.fontId) ids.add(part.fontId);
    // 줄 안의 글도 폰트를 쓴다. 빠뜨리면 그 줄만 폴백 폰트로 굳고 폭도 틀리게 잡힌다
    if (part.kind === 'row') {
      for (const item of part.items) {
        if (item.kind === 'text' && item.fontId) ids.add(item.fontId);
      }
    }
  }

  return [...ids];
}
