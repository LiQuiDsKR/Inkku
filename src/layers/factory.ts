import { createId } from '@/utils/id';
import type { PhotoLayer } from './types';

/** 새 사진이 캔버스 가로폭에서 차지할 비율. 꾸밀 여백이 남을 만큼만 크게 넣는다. */
const PHOTO_FILL_RATIO = 0.7;

/** 여러 장을 한 번에 넣을 때 겹쳐 보이지 않도록 어긋내는 간격(논리 좌표). */
const CASCADE_STEP = 48;

export interface CreatePhotoLayerParams {
  imageId: string;
  naturalWidth: number;
  naturalHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  zIndex: number;
  /** 한 번에 여러 장 추가할 때의 순번. 위치를 조금씩 어긋내는 데만 쓴다. */
  cascadeIndex?: number;
}

export function createPhotoLayer(params: CreatePhotoLayerParams): PhotoLayer {
  const { imageId, naturalWidth, naturalHeight, canvasWidth, canvasHeight, zIndex } = params;
  const cascadeIndex = params.cascadeIndex ?? 0;

  // 가로로도 세로로도 캔버스를 넘지 않게 맞춘다. 세로로 긴 사진이 위아래로 삐져나오는 걸 막는다.
  const scale = Math.min(
    (canvasWidth * PHOTO_FILL_RATIO) / naturalWidth,
    (canvasHeight * PHOTO_FILL_RATIO) / naturalHeight,
  );

  // 완전히 겹치면 여러 장을 넣었는지 알 수 없다. 대각선으로 조금씩 밀어 둔다.
  const offset = cascadeIndex * CASCADE_STEP;

  return {
    id: createId(),
    type: 'photo',
    // x, y는 레이어의 중심이다. 회전과 확대가 중심 기준으로 돌아야 손끝 느낌이 자연스럽다.
    x: canvasWidth / 2 + offset,
    y: canvasHeight / 2 + offset,
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
    opacity: 1,
    zIndex,
    imageId,
    naturalWidth,
    naturalHeight,
  };
}
