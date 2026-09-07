import { createId } from '@/utils/id';
import { findFont } from '@/fonts/catalog';
import { defaultTextShadow, defaultTextStroke } from './textStyle';
import type { TextDraft } from './textDraft';
import type { PhotoLayer, StickerLayer, TextLayer } from './types';

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

/** 스티커가 캔버스 가로폭에서 차지할 기본 비율. 처음부터 크게 넣으면 줄이는 손이 한 번 더 간다. */
const STICKER_FILL_RATIO = 0.32;

export interface CreateStickerLayerParams {
  assetId: string;
  assetUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  zIndex: number;
  cascadeIndex?: number;
}

export function createStickerLayer(params: CreateStickerLayerParams): StickerLayer {
  const { assetId, assetUrl, naturalWidth, naturalHeight, canvasWidth, canvasHeight, zIndex } =
    params;

  // 세로로 긴 스티커가 캔버스 밖으로 나가지 않도록 두 축을 모두 본다
  const scale = Math.min(
    (canvasWidth * STICKER_FILL_RATIO) / naturalWidth,
    (canvasHeight * STICKER_FILL_RATIO) / naturalHeight,
  );

  // 연달아 탭하면 같은 자리에 겹쳐서 한 장만 붙은 것처럼 보인다. 조금씩 어긋내 준다.
  const offset = (params.cascadeIndex ?? 0) * CASCADE_STEP;

  return {
    id: createId(),
    type: 'sticker',
    x: canvasWidth / 2 + offset,
    y: canvasHeight / 2 + offset,
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
    opacity: 1,
    zIndex,
    assetId,
    assetUrl,
    naturalWidth,
    naturalHeight,
  };
}

/** 줄 간격. 한글은 1.0이면 받침이 윗줄에 붙어 보인다. */
const DEFAULT_LINE_HEIGHT = 1.25;

export interface CreateTextLayerParams {
  draft: TextDraft;
  canvasWidth: number;
  canvasHeight: number;
  zIndex: number;
}

/**
 * 편집 모달의 초안을 그대로 레이어로 만든다.
 * 외곽선과 그림자 값을 여기서 따로 계산하지 않는다.
 * 새로 만든 글자와 고친 글자가 다른 두께를 갖지 않도록 두 경로 모두 textStyle의 같은 함수를 쓴다.
 */
export function createTextLayer(params: CreateTextLayerParams): TextLayer {
  const { draft, canvasWidth, canvasHeight, zIndex } = params;
  const font = findFont(draft.fontId);

  return {
    id: createId(),
    type: 'text',
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    // 글자 크기는 fontSize로 정하므로 배율은 1에서 시작한다.
    // 배율로 키우면 외곽선 두께까지 같이 늘어나 굵기를 따로 조절할 수 없다.
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    zIndex,
    content: draft.content,
    fontId: font.id,
    fontFamily: font.family,
    fontSize: draft.fontSize,
    color: draft.color,
    align: draft.align,
    lineHeight: DEFAULT_LINE_HEIGHT,
    stroke: draft.stroke ? defaultTextStroke(draft.fontSize) : undefined,
    shadow: draft.shadow ? defaultTextShadow(draft.fontSize) : undefined,
  };
}
