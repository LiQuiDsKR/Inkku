import type { Background } from '@/layers/types';

/**
 * 배경 프리셋.
 *
 * 색상환이나 그라데이션 편집기를 주지 않는다. 폰에서 손가락으로 색을 고르는 일은 느리고,
 * 잘 고른 프리셋 열 몇 개가 결과물이 더 낫다.
 */

function textureUrl(file: string): string {
  return `${import.meta.env.BASE_URL}mock-assets/${file}`;
}

export const BACKGROUND_COLORS: readonly string[] = [
  '#ffffff',
  '#111113',
  '#f8f0dd',
  '#ffe3e8',
  '#e4f1ff',
  '#e8f6e8',
  '#fff4cc',
  '#efe6ff',
];

export interface GradientPreset {
  id: string;
  from: string;
  to: string;
  angle: number;
}

export const BACKGROUND_GRADIENTS: readonly GradientPreset[] = [
  { id: 'sunset', from: '#ff9a8b', to: '#ff6a88', angle: 135 },
  { id: 'sky', from: '#a1c4fd', to: '#c2e9fb', angle: 135 },
  { id: 'mint', from: '#d4fc79', to: '#96e6a1', angle: 135 },
  { id: 'grape', from: '#c471f5', to: '#fa71cd', angle: 135 },
  { id: 'cream', from: '#fff1eb', to: '#ace0f9', angle: 90 },
  { id: 'night', from: '#232526', to: '#414345', angle: 90 },
];

export interface TexturePreset {
  id: string;
  label: string;
  url: string;
}

export const BACKGROUND_TEXTURES: readonly TexturePreset[] = [
  { id: 'grid', label: '모눈', url: textureUrl('texture-grid.svg') },
  { id: 'dots', label: '점무늬', url: textureUrl('texture-dots.svg') },
  { id: 'stripe', label: '사선', url: textureUrl('texture-stripe.svg') },
  { id: 'confetti', label: '조각', url: textureUrl('texture-confetti.svg') },
];

/** 사진 흐리게 배경의 기본 흐림 정도(논리 좌표 기준 픽셀). */
export const PHOTO_BLUR_RADIUS = 48;

export function solidBackground(color: string): Background {
  return { type: 'solid', color };
}

export function gradientBackground(preset: GradientPreset): Background {
  return { type: 'gradient', from: preset.from, to: preset.to, angle: preset.angle };
}

export function textureBackground(preset: TexturePreset): Background {
  return { type: 'texture', assetUrl: preset.url };
}

export function photoBlurBackground(imageId: string): Background {
  return { type: 'photoBlur', imageId, blur: PHOTO_BLUR_RADIUS };
}
