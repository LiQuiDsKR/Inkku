import { findParticleShape } from './particleCatalog';
import { findShape } from './shapeCatalog';
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
  text: '텍스트',
  drawing: '낙서',
  shape: '도형',
  presetLine: '꾸밈선',
  particle: '파티클',
  textSticker: '문구 스티커',
};

/** 목록 한 줄에 들어갈 길이. 넘치면 잘라서 뒤에 점을 붙인다. */
const MAX_DETAIL = 14;

function clip(value: string): string {
  const single = value.replace(/\s+/g, ' ').trim();
  return single.length > MAX_DETAIL ? `${single.slice(0, MAX_DETAIL)}...` : single;
}

/**
 * 'noto/grinning-face' 같은 id에서 사람이 읽을 부분만. 팩 이름과 하이픈은 목록에서 잡음이다.
 * 직접 넣은 스티커는 이름 끝에 크기와 해시가 붙어 있어서('-400_00be2007d8') 떼고, 숫자만 남으면 '그림'이라 부른다.
 */
function assetName(assetId: string): string {
  const name = (assetId.split('/').pop() ?? assetId)
    .replace(/-\d+_[0-9a-f]{6,}$/i, '')
    .replace(/^oc-\d+$/, '그림')
    .replace(/-/g, ' ');
  return /^[\d\s]+$/.test(name) ? '그림' : name;
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
    case 'textSticker':
      return { kind, detail: clip(layer.text) };
    case 'shape':
      return { kind, detail: findShape(layer.shape).label };
    case 'sticker':
    case 'presetLine':
      return { kind, detail: clip(assetName(layer.assetId)) };
    case 'particle':
      return { kind, detail: findParticleShape(layer.kind).label };
    default:
      return { kind, detail: '' };
  }
}
