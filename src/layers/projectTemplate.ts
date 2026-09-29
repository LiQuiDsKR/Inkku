import { defaultFields } from '@/templates/catalog';
import type { TemplateSpec } from '@/templates/types';
import type { Layer, ProjectTemplate } from './types';

/**
 * 깔아 둔 템플릿 카드의 생성과 부분 갱신.
 *
 * 크기와 위치를 여기서 정하지 않는다. 카드는 배경처럼 캔버스에 맞춰 놓이므로
 * 놓일 자리는 그릴 때 캔버스 크기에서 계산한다(templateGeometry의 fitTemplate).
 * 값으로 저장해 두면 비율을 바꿨을 때 카드만 옛 크기로 남는다.
 */

export function createProjectTemplate(spec: TemplateSpec, variantId: string): ProjectTemplate {
  return {
    templateId: spec.id,
    variantId,
    fields: defaultFields(spec),
    slots: {},
  };
}

/** 필드 하나만 바꾼 새 fields. 스토어에는 항상 통째로 바뀐 객체를 넘긴다. */
export function withField(
  template: ProjectTemplate,
  fieldId: string,
  value: string,
): Record<string, string> {
  return { ...template.fields, [fieldId]: value };
}

/** 슬롯 하나만 바꾼 새 slots. imageId가 null이면 그 자리를 비운다. */
export function withSlot(
  template: ProjectTemplate,
  slotId: string,
  imageId: string | null,
): Record<string, string> {
  const next = { ...template.slots };
  if (imageId) next[slotId] = imageId;
  // 빈 문자열을 남기면 "사진이 있는데 못 찾는 상태"가 되어 빈 칸이 영영 안 그려진다
  else delete next[slotId];
  return next;
}

/**
 * 카드를 레이어로 저장하던 시절의 작업물을 읽는다.
 *
 * 카드는 요소가 아니라 배경과 같은 층위로 바뀌었다. 예전 작업물의 레이어 목록에는
 * 지금 유니온에 없는 type이 남아 있는데, 그대로 두면 아무것도 그리지 않으면서
 * 레이어 목록과 선택에는 잡히는 유령이 된다. 열 때 한 번 걷어 낸다.
 */
interface LegacyTemplateLayer {
  templateId: string;
  variantId: string;
  fields?: Record<string, string>;
  slots?: Record<string, string>;
}

function asLegacyTemplate(layer: Layer): LegacyTemplateLayer | null {
  // Layer 유니온에 'template'이 없으므로 타입 단계에서는 비교조차 되지 않는다. 런타임 값을 본다.
  if ((layer as { type: string }).type !== 'template') return null;

  const candidate: unknown = layer;
  if (typeof candidate !== 'object' || candidate === null) return null;

  const record = candidate as Record<string, unknown>;
  if (typeof record.templateId !== 'string' || typeof record.variantId !== 'string') return null;

  return {
    templateId: record.templateId,
    variantId: record.variantId,
    fields: isStringMap(record.fields) ? record.fields : undefined,
    slots: isStringMap(record.slots) ? record.slots : undefined,
  };
}

function isStringMap(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}

export interface MigratedTemplate {
  template: ProjectTemplate | null;
  layers: Layer[];
}

/** 레이어에 섞여 있던 카드를 빼내 프로젝트 한 겹으로 올린다. 여러 장이면 맨 뒤의 것만 남는다. */
export function extractLegacyTemplate(layers: readonly Layer[]): MigratedTemplate {
  let template: ProjectTemplate | null = null;
  const kept: Layer[] = [];

  for (const layer of layers) {
    const legacy = asLegacyTemplate(layer);
    if (!legacy) {
      kept.push(layer);
      continue;
    }
    template = {
      templateId: legacy.templateId,
      variantId: legacy.variantId,
      fields: legacy.fields ?? {},
      slots: legacy.slots ?? {},
    };
  }

  return { template, layers: kept };
}
