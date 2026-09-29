import type { PhotoMask } from './types';

/**
 * 사진 보정 프리셋.
 *
 * 밝기, 대비, 채도를 각각 슬라이더로 주지 않는다. 폰 화면에서 손가락으로 값을 맞추는 일은 느리고,
 * 대부분은 "따뜻하게" 같은 한 번의 선택으로 끝난다. 세부 조절이 정말 필요해지면 그때 연다.
 */

export type FilterPresetId = 'none' | 'bright' | 'warm' | 'cool' | 'mono' | 'vintage';

export interface FilterPreset {
  id: FilterPresetId;
  label: string;
  /** Konva 필터 파라미터. 캔버스 쪽에서 실제 필터 함수로 옮긴다. */
  brighten: number;
  contrast: number;
  hue: number;
  saturation: number;
  grayscale: boolean;
  sepia: boolean;
  /** 패널 썸네일용. 캔버스 필터와 정확히 같지는 않고 느낌만 맞춘다. */
  css: string;
}

/** 보정 없음. 목록의 첫 항목이자 알 수 없는 값이 들어왔을 때의 폴백이다. */
const NO_FILTER: FilterPreset = {
  id: 'none',
  label: '원본',
  brighten: 0,
  contrast: 0,
  hue: 0,
  saturation: 0,
  grayscale: false,
  sepia: false,
  css: 'none',
};

export const FILTER_PRESETS: readonly FilterPreset[] = [
  NO_FILTER,
  {
    id: 'bright',
    label: '밝게',
    brighten: 0.12,
    contrast: 8,
    hue: 0,
    saturation: 0.2,
    grayscale: false,
    sepia: false,
    css: 'brightness(1.12) contrast(1.08) saturate(1.1)',
  },
  {
    id: 'warm',
    label: '따뜻하게',
    brighten: 0.05,
    contrast: 4,
    hue: -12,
    saturation: 0.5,
    grayscale: false,
    sepia: false,
    css: 'sepia(0.25) saturate(1.25) brightness(1.05)',
  },
  {
    id: 'cool',
    label: '차갑게',
    brighten: 0.03,
    contrast: 6,
    hue: 14,
    saturation: 0.3,
    grayscale: false,
    sepia: false,
    css: 'hue-rotate(12deg) saturate(1.15) brightness(1.03)',
  },
  {
    id: 'mono',
    label: '흑백',
    brighten: 0.02,
    contrast: 12,
    hue: 0,
    saturation: 0,
    grayscale: true,
    sepia: false,
    css: 'grayscale(1) contrast(1.12)',
  },
  {
    id: 'vintage',
    label: '빈티지',
    brighten: 0.04,
    contrast: -6,
    hue: 0,
    saturation: 0,
    grayscale: false,
    sepia: true,
    css: 'sepia(0.55) contrast(0.94) brightness(1.04)',
  },
];

export function findFilterPreset(id: string): FilterPreset {
  // 목록에서 사라진 프리셋을 참조하는 예전 작업물도 열려야 한다
  return FILTER_PRESETS.find((preset) => preset.id === id) ?? NO_FILTER;
}

/**
 * 고를 수 있는 자르기 모양.
 * 도형 목록과 이름을 맞춘다. 같은 하트를 도형에서는 "하트", 사진에서는 다른 말로 부르면 헷갈린다.
 */
export const PHOTO_MASKS: readonly { mask: PhotoMask; label: string }[] = [
  { mask: 'rounded', label: '둥근모서리' },
  { mask: 'circle', label: '원' },
  { mask: 'star', label: '별' },
  { mask: 'heart', label: '하트' },
  { mask: 'triangle', label: '삼각형' },
  { mask: 'diamond', label: '마름모' },
];
