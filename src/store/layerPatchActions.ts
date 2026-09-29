import {
  patchAssetTint,
  patchParticleLayer,
  patchPhotoLayer,
  patchShapeLayer,
  patchTextLayer,
} from '@/layers/mutations';
import type { Layer, ParticleLayer, PhotoLayer, Project, ShapeLayer, TextLayer } from '@/layers/types';

/**
 * 레이어 타입별 속성 수정.
 *
 * 스토어 본체에서 떼어 낸 이유는 파일 길이다. 타입이 늘 때마다 같은 모양의 액션이 하나씩 붙어서
 * 본체가 250줄을 넘었다. 여기 있는 액션도 전부 스토어의 applyLayers 한 경로로 기록된다.
 */

export type TextPatch = Partial<Omit<TextLayer, 'id' | 'type'>>;
export type ShapePatch = Partial<Omit<ShapeLayer, 'id' | 'type'>>;
export type PhotoPatch = Partial<Omit<PhotoLayer, 'id' | 'type'>>;
export type ParticlePatch = Partial<Omit<ParticleLayer, 'id' | 'type'>>;

export interface LayerPatchActions {
  updateTextLayer: (id: string, patch: TextPatch) => void;
  updateShapeLayer: (id: string, patch: ShapePatch) => void;
  updateParticleLayer: (id: string, patch: ParticlePatch) => void;
  /** 자르기 슬라이더처럼 연속으로 바뀌는 값은 첫 변경만 기록한다. */
  updatePhotoLayer: (id: string, patch: PhotoPatch, record?: boolean) => void;
  /** 색을 입힐 수 있는 에셋의 색. 색이 없는 에셋이면 아무 일도 하지 않는다. */
  setAssetTint: (id: string, tint: string) => void;
}

type ApplyLayers = (layers: readonly Layer[], record?: boolean) => void;

export function createLayerPatchActions(
  getProject: () => Project | null,
  applyLayers: ApplyLayers,
): LayerPatchActions {
  const run = (change: (layers: readonly Layer[]) => Layer[], record = true): void => {
    const project = getProject();
    if (!project) return;
    applyLayers(change(project.layers), record);
  };

  return {
    updateTextLayer: (id, patch) => run((layers) => patchTextLayer(layers, id, patch)),
    updateShapeLayer: (id, patch) => run((layers) => patchShapeLayer(layers, id, patch)),
    updateParticleLayer: (id, patch) => run((layers) => patchParticleLayer(layers, id, patch)),
    updatePhotoLayer: (id, patch, record = true) =>
      run((layers) => patchPhotoLayer(layers, id, patch), record),
    setAssetTint: (id, tint) => run((layers) => patchAssetTint(layers, id, tint)),
  };
}
