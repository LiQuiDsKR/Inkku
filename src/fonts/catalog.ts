/**
 * 감성 텍스트용 폰트 목록.
 *
 * 처음부터 전부 받아 두지 않는다. 한글 웹폰트는 한 벌이 수백 KB라
 * 다섯 벌을 미리 받으면 폰에서 첫 진입이 눈에 띄게 느려진다. 고른 시점에 하나씩 받는다.
 */

export interface FontOption {
  id: string;
  label: string;
  /** 캔버스와 CSS에 그대로 넘기는 family 문자열. 폴백까지 포함한다. */
  family: string;
  weight: number;
  /** Google Fonts css2의 family 파라미터. 시스템 폰트는 내려받을 것이 없어 비운다. */
  googleFamily?: string;
}

/** 내려받을 것이 없어 항상 즉시 그릴 수 있는 폰트. 폴백 기준점이기도 하다. */
const SYSTEM_FONT: FontOption = {
  id: 'system',
  label: '기본',
  family: 'system-ui, sans-serif',
  weight: 700,
};

export const DEFAULT_FONT_ID = SYSTEM_FONT.id;

export const FONT_OPTIONS: readonly FontOption[] = [
  SYSTEM_FONT,
  {
    id: 'gaegu',
    label: '손글씨',
    family: '"Gaegu", system-ui, sans-serif',
    weight: 700,
    googleFamily: 'Gaegu:wght@700',
  },
  {
    id: 'nanum-pen',
    label: '펜글씨',
    family: '"Nanum Pen Script", system-ui, sans-serif',
    weight: 400,
    googleFamily: 'Nanum+Pen+Script',
  },
  {
    id: 'black-han',
    label: '굵은고딕',
    family: '"Black Han Sans", system-ui, sans-serif',
    weight: 400,
    googleFamily: 'Black+Han+Sans',
  },
  {
    id: 'do-hyeon',
    label: '둥근고딕',
    family: '"Do Hyeon", system-ui, sans-serif',
    weight: 400,
    googleFamily: 'Do+Hyeon',
  },
];

export function findFont(id: string): FontOption {
  // 목록에서 사라진 폰트를 참조하는 예전 프로젝트도 열려야 하므로 기본값으로 떨어뜨린다
  return FONT_OPTIONS.find((font) => font.id === id) ?? SYSTEM_FONT;
}
