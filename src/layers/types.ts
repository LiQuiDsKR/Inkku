/**
 * 프로젝트 전체의 기준이 되는 데이터 모델.
 *
 * 모든 요소는 레이어다. 위치/크기/회전/투명도/순서는 BaseLayer가 공통으로 갖고,
 * 타입별 파일은 "어떻게 그리는가"만 정의한다.
 * 이렇게 해야 이동/회전/삭제/순서변경 로직을 타입마다 다시 만들지 않는다.
 */

export type Ratio = '4:5' | '1:1' | '9:16' | '3:4';

export type LayerType = 'photo' | 'sticker' | 'text' | 'drawing' | 'shape' | 'presetLine';

export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degree
  opacity: number; // 0~1
  zIndex: number;
  /**
   * 좌우반전. scaleX의 부호로 표현하지 않는다.
   * 제스처 계산이 음수 배율을 만나면 회전축이 뒤집혀 손가락과 반대로 돈다.
   * 모든 타입이 뒤집을 수 있어야 하므로 공통 속성으로 둔다.
   */
  flipX?: boolean;
}

/**
 * 사진 원본 데이터는 절대 이 안에 넣지 않는다.
 * 히스토리 스냅샷이 레이어 구조를 통째로 복사하기 때문에,
 * 이미지가 들어가면 30단계 히스토리가 수백 MB가 된다. 실제 픽셀은 IndexedDB에 둔다.
 */
export interface PhotoLayer extends BaseLayer {
  type: 'photo';
  imageId: string;
  naturalWidth: number;
  naturalHeight: number;
  crop?: { x: number; y: number; width: number; height: number };
  border?: { style: 'none' | 'plain' | 'polaroid'; color: string; width: number };
  filter?: { preset: string; intensity: number };
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  assetId: string;
  assetUrl: string;
  /**
   * 에셋 원본 크기를 레이어에 복사해 둔다.
   * 이미지가 도착하기 전에도 그룹 크기가 정해져야 Transformer가 0짜리 박스를 잡지 않는다.
   */
  naturalWidth: number;
  naturalHeight: number;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  /** 폰트 카탈로그의 id. 실제 CSS family는 로더가 해석한다. */
  fontId: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: TextAlign;
  lineHeight: number;
  stroke?: { color: string; width: number };
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
}

/** 자유 그리기는 점이 쌓이면 느려져서, 손을 떼는 순간 이미지로 굳혀 일반 레이어로 만든다. */
export interface DrawingLayer extends BaseLayer {
  type: 'drawing';
  imageId: string;
  /**
   * 논리 좌표에서 차지하는 크기.
   * 저장된 이미지는 내보내기 화질을 위해 이보다 크게 굽는다. 그래서 사진처럼
   * 원본 픽셀 크기를 그대로 쓰지 않고 그릴 크기를 따로 들고 있는다.
   */
  width: number;
  height: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shape: 'rect' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow';
  fill?: string;
  stroke?: { color: string; width: number };
}

/** 꾸밈선. 스티커와 그리는 방식은 같고, 처음 놓이는 크기만 다르다(가로로 길게). */
export interface PresetLineLayer extends BaseLayer {
  type: 'presetLine';
  assetId: string;
  assetUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

export type Layer =
  | PhotoLayer
  | StickerLayer
  | TextLayer
  | DrawingLayer
  | ShapeLayer
  | PresetLineLayer;

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'texture'; assetUrl: string }
  | { type: 'photoBlur'; imageId: string; blur: number };

export interface Project {
  id: string;
  ratio: Ratio;
  background: Background;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 레이어 타입별 좁히기 헬퍼.
 * `any` 없이 유니온을 다루려면 호출부마다 타입 가드가 필요한데,
 * 매번 `layer.type === '...'`를 쓰면 리팩터링 때 놓치는 곳이 생긴다.
 */
export const isPhotoLayer = (layer: Layer): layer is PhotoLayer => layer.type === 'photo';
export const isStickerLayer = (layer: Layer): layer is StickerLayer => layer.type === 'sticker';
export const isTextLayer = (layer: Layer): layer is TextLayer => layer.type === 'text';
export const isDrawingLayer = (layer: Layer): layer is DrawingLayer => layer.type === 'drawing';
export const isShapeLayer = (layer: Layer): layer is ShapeLayer => layer.type === 'shape';
export const isPresetLineLayer = (layer: Layer): layer is PresetLineLayer =>
  layer.type === 'presetLine';
