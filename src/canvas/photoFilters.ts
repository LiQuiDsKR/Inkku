import Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { findFilterPreset, type FilterPreset } from '@/layers/photoStyle';

/**
 * 프리셋을 Konva 필터 설정으로 옮긴다.
 *
 * 필터 함수 자체는 Konva에 있고 값은 layers/photoStyle에 있다.
 * 값과 캔버스 구현을 갈라 둬야 프리셋을 손볼 때 캔버스 코드를 건드리지 않는다.
 */
export interface KonvaFilterConfig {
  filters: Filter[];
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
}

export function toFilterConfig(presetId: string | undefined): KonvaFilterConfig | null {
  if (!presetId || presetId === 'none') return null;
  const preset: FilterPreset = findFilterPreset(presetId);
  if (preset.id === 'none') return null;

  const filters: Filter[] = [];
  // HSL 하나로 색조와 채도를 함께 다룬다. 필터를 여러 개 겹치면 그만큼 픽셀을 여러 번 훑는다.
  if (preset.hue !== 0 || preset.saturation !== 0) filters.push(Konva.Filters.HSL);
  if (preset.brighten !== 0) filters.push(Konva.Filters.Brighten);
  if (preset.contrast !== 0) filters.push(Konva.Filters.Contrast);
  if (preset.grayscale) filters.push(Konva.Filters.Grayscale);
  if (preset.sepia) filters.push(Konva.Filters.Sepia);

  return {
    filters,
    brightness: preset.brighten,
    contrast: preset.contrast,
    hue: preset.hue,
    saturation: preset.saturation,
  };
}
