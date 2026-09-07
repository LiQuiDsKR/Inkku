import { DEFAULT_FONT_ID, findFont } from '@/fonts/catalog';
import { defaultTextShadow, defaultTextStroke } from './textStyle';
import type { TextAlign, TextLayer } from './types';

/**
 * 편집 모달이 들고 있는 임시 상태.
 *
 * 모달에서 바꿀 때마다 레이어를 고치면 실행취소 한 번에 한 글자씩 되돌아간다.
 * 초안을 따로 들고 있다가 완료 시점에 한 번만 반영한다.
 */
export interface TextDraft {
  content: string;
  fontId: string;
  color: string;
  align: TextAlign;
  fontSize: number;
  /** 외곽선과 그림자는 켜고 끄기만 하고 세부 값은 글자 크기에서 자동으로 나온다. */
  stroke: boolean;
  shadow: boolean;
}

export const DEFAULT_TEXT_SIZE = 86;

export function createTextDraft(): TextDraft {
  return {
    content: '',
    fontId: DEFAULT_FONT_ID,
    color: '#ffffff',
    align: 'center',
    fontSize: DEFAULT_TEXT_SIZE,
    // 사진 위에 흰 글자만 얹으면 밝은 배경에서 안 보인다. 외곽선을 기본으로 켜 둔다.
    stroke: true,
    shadow: false,
  };
}

export function draftFromLayer(layer: TextLayer): TextDraft {
  return {
    content: layer.content,
    fontId: layer.fontId,
    color: layer.color,
    align: layer.align,
    fontSize: layer.fontSize,
    stroke: Boolean(layer.stroke),
    shadow: Boolean(layer.shadow),
  };
}

/** 초안을 레이어 패치로 바꾼다. 끈 항목은 undefined로 남겨 속성 자체를 지운다. */
export function draftToPatch(draft: TextDraft): Partial<Omit<TextLayer, 'id' | 'type'>> {
  const font = findFont(draft.fontId);
  return {
    content: draft.content,
    fontId: font.id,
    fontFamily: font.family,
    fontSize: draft.fontSize,
    color: draft.color,
    align: draft.align,
    stroke: draft.stroke ? defaultTextStroke(draft.fontSize) : undefined,
    shadow: draft.shadow ? defaultTextShadow(draft.fontSize) : undefined,
  };
}
