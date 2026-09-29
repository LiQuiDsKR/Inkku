import { findParticleShape } from './particles';
import type { Layer } from './types';

/**
 * 레이어 목록에 쓸 이름.
 *
 * 캔버스에서 겹친 레이어를 손가락으로 골라내는 것은 어렵다(투명한 부분도 눌린다).
 * 목록에서 고를 수 있으려면 어떤 레이어인지 글로 구분되어야 한다.
 */
const KIND_LABEL: Record<Layer['type'], string> = {
  photo: '사진',
  sticker: '스티커',
  text: '글자',
  drawing: '낙서',
  shape: '도형',
  presetLine: '꾸밈선',
  particle: '파티클',
};

const SHAPE_LABEL: Record<string, string> = {
  rect: '사각형',
  circle: '원',
  triangle: '삼각형',
  star: '별',
  heart: '하트',
  arrow: '화살표',
};

/** 목록 한 줄에 들어갈 길이. 넘치면 잘라서 뒤에 점을 붙인다. */
const MAX_DETAIL = 14;

function clip(value: string): string {
  const single = value.replace(/\s+/g, ' ').trim();
  return single.length > MAX_DETAIL ? `${single.slice(0, MAX_DETAIL)}...` : single;
}

export interface LayerDescription {
  kind: string;
  detail: string;
}

export function describeLayer(layer: Layer): LayerDescription {
  const kind = KIND_LABEL[layer.type];

  switch (layer.type) {
    case 'text':
      return { kind, detail: clip(layer.content) };
    case 'shape':
      return { kind, detail: SHAPE_LABEL[layer.shape] ?? layer.shape };
    case 'sticker':
    case 'presetLine':
      return { kind, detail: layer.assetId };
    case 'particle':
      return { kind, detail: findParticleShape(layer.kind).label };
    default:
      return { kind, detail: '' };
  }
}
