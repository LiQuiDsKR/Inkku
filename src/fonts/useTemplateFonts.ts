import { useEffect, useState } from 'react';
import { collectFontIds } from '@/templates/catalog';
import { ensureFont } from './loadFont';
import type { TemplateSpec } from '@/templates/types';

/**
 * 템플릿 카드가 쓰는 글꼴.
 *
 * 카드 글자는 대부분 앱과 같은 UI 폰트로 그린다. 그런데 이 폰트는 index.html이
 * 렌더를 막지 않으려고 비동기로 붙이기 때문에, 캔버스가 먼저 그려지면 폴백으로 굳는다.
 * 도착한 시점에 한 번 다시 그려야 한다.
 */

/** 캔버스와 CSS에 그대로 넘기는 family 문자열. 한글은 어차피 시스템 폰트로 떨어진다. */
export const CARD_FONT_FAMILY =
  '"Plus Jakarta Sans", "Pretendard Variable", Pretendard, system-ui, sans-serif';

/** 크기 단위가 없으면 SyntaxError가 난다. 값은 측정용이라 실제 크기와 달라도 된다. */
const CARD_FONT_SPEC = '700 64px "Plus Jakarta Sans"';

async function ensureCardFont(): Promise<void> {
  try {
    await document.fonts.load(CARD_FONT_SPEC);
  } catch {
    // 못 받아도 시스템 폰트로 그린다. 글꼴 하나 때문에 카드를 못 넣게 할 이유가 없다.
  }
}

/**
 * 카드에 필요한 폰트를 받고, 끝나면 값이 오르는 토큰을 준다.
 *
 * 기준 글자로 스펙의 기본값을 쓴다. 사용자가 치는 글로 잡으면 한 글자마다 이 훅이 다시 돌고
 * 토큰이 올라, 그때마다 카드 노드가 통째로 다시 만들어져 입력이 끊긴다.
 */
export function useTemplateFonts(spec: TemplateSpec | null): number {
  const [token, setToken] = useState(0);

  // 배열을 의존성에 그대로 넣으면 매 렌더 새 배열이라 effect가 끝없이 돈다
  const fontIds = spec ? collectFontIds(spec).join(',') : '';
  const sample = spec ? spec.fields.map((field) => field.value).join('') : '';

  useEffect(() => {
    let alive = true;
    const ids = fontIds ? fontIds.split(',') : [];

    void Promise.all([ensureCardFont(), ...ids.map((id) => ensureFont(id, sample))]).then(() => {
      if (alive) setToken((value) => value + 1);
    });

    return () => {
      alive = false;
    };
  }, [fontIds, sample]);

  return token;
}

/**
 * 사용자가 새로 친 글자의 조각을 받아 둔다.
 *
 * 한글 웹폰트는 유니코드 구간별로 쪼개져 있어서 실제로 쓸 글자를 넘겨야 그 조각이 온다.
 * 토큰을 올리지 않는 이유는 입력 중에 카드를 다시 만들지 않기 위해서다.
 * 조각은 다음 글자를 칠 때 함께 반영된다.
 */
export function useTemplateTextFonts(spec: TemplateSpec | null, text: string): void {
  const fontIds = spec ? collectFontIds(spec).join(',') : '';

  useEffect(() => {
    if (!fontIds || !text) return;
    for (const id of fontIds.split(',')) void ensureFont(id, text);
  }, [fontIds, text]);
}
