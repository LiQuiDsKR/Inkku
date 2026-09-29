/**
 * 프로젝트 전체의 기준이 되는 데이터 모델.
 *
 * 모든 요소는 레이어다. 위치/크기/회전/투명도/순서는 BaseLayer가 공통으로 갖고,
 * 타입별 파일은 "어떻게 그리는가"만 정의한다.
 * 이렇게 해야 이동/회전/삭제/순서변경 로직을 타입마다 다시 만들지 않는다.
 */

// 타입만 가져온다. 값이 오가지 않으므로 서로 참조해도 실행 시점에 순환이 생기지 않는다.
import type { ParticleKind } from './particleCatalog';
import type { FrameStyle } from './photoFrame';
import type { ShapeKind } from './shapeCatalog';

export type Ratio = '4:5' | '1:1' | '9:16' | '3:4';

export type LayerType =
  | 'photo'
  | 'sticker'
  | 'text'
  | 'drawing'
  | 'shape'
  | 'presetLine'
  | 'particle';

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
}

/**
 * 사진 원본 데이터는 절대 이 안에 넣지 않는다.
 * 히스토리 스냅샷이 레이어 구조를 통째로 복사하기 때문에,
 * 이미지가 들어가면 30단계 히스토리가 수백 MB가 된다. 실제 픽셀은 IndexedDB에 둔다.
 */
/** 사진을 잘라 낼 도형. 없으면 사각형 그대로 둔다. */
export type PhotoMask = 'rounded' | 'circle' | 'star' | 'heart' | 'triangle' | 'diamond';

export interface PhotoLayer extends BaseLayer {
  type: 'photo';
  imageId: string;
  naturalWidth: number;
  naturalHeight: number;
  crop?: { x: number; y: number; width: number; height: number };
  /** 프레임. 생김새는 `layers/photoFrame.ts`의 프리셋이 정하고, 여기에는 고른 것만 담는다. */
  border?: { style: FrameStyle; color: string };
  filter?: { preset: string; intensity: number };
  /**
   * 도형 자르기.
   * 테두리와 함께 쓰지 않는다. 하트 둘레에 네모난 액자를 두르면 둘 다 망가진다.
   */
  mask?: PhotoMask;
  /**
   * 도형 안에서 사진을 키운 정도. 1이면 도형을 꽉 채우는 최소 크기다.
   * 1보다 작게 두지 않는다. 도형 안에 빈 자리가 생긴다.
   */
  maskZoom?: number;
  /**
   * 도형 안에서 사진을 민 정도. 각 축 -1~1이고 0이 가운데다.
   * 픽셀이 아니라 비율로 두는 이유는, 사진을 키우면 밀 수 있는 여유도 함께 늘어나기 때문이다.
   * 픽셀로 저장하면 배율을 바꿀 때마다 위치가 튄다.
   */
  maskOffset?: { x: number; y: number };
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
  /**
   * 입힌 색. 한 가지 색으로 그린 에셋(낙서)만 갖는다.
   * 원본 SVG의 currentColor를 이 색으로 바꿔 그린다. 없으면 원본 색 그대로다.
   */
  tint?: string;
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
  shape: ShapeKind;
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
  /** 스티커와 같다. 구분선도 한 가지 색이면 색을 입힐 수 있다. */
  tint?: string;
}

/**
 * 반짝이나 꽃잎처럼 여러 개가 흩뿌려진 한 벌.
 *
 * 흩뿌린 자리를 좌표로 저장하지 않고 seed만 둔다. 같은 seed는 언제나 같은 배치를 만들기 때문에
 * 결과는 같으면서 레이어 하나가 점 목록으로 불어나지 않는다(`layers/particles.ts`).
 */
export interface ParticleLayer extends BaseLayer {
  type: 'particle';
  kind: ParticleKind;
  seed: number;
  count: number;
  color: string;
  /**
   * 흩뿌린 영역의 가로/세로 비율. 캔버스 비율을 따라 넣을 때 정한다.
   * 없으면 정사각형이다. 이 값이 생기기 전에 저장한 파티클이 예전 배치 그대로 그려져야 한다.
   */
  aspect?: number;
}

export type Layer =
  | PhotoLayer
  | StickerLayer
  | TextLayer
  | DrawingLayer
  | ShapeLayer
  | PresetLineLayer
  | ParticleLayer;

/**
 * 지도 카드, 블로그 글머리, 뮤직 플레이어처럼 미리 짜인 한 벌.
 *
 * 레이어가 아니다. 카드는 배경과 마찬가지로 캔버스 자체의 성격을 정하는 한 겹이라
 * 손으로 옮기거나 돌리거나 순서를 바꾸는 대상이 아니다. 한 작업물에 하나만 깔린다.
 *
 * 생김새(어디에 무엇을 그리는가)는 src/templates의 스펙이 갖는다.
 * 여기에는 "어떤 스펙을, 어떤 변형으로, 어떤 값을 채워" 그릴지만 둔다.
 * 그래야 카드 디자인을 고쳐도 저장된 작업물이 새 디자인으로 다시 그려진다.
 */
export interface ProjectTemplate {
  templateId: string;
  /** 화이트/다크 같은 색 변형. 스펙에서 사라졌으면 첫 변형으로 떨어진다. */
  variantId: string;
  /** 필드 id에 대응하는 사용자 입력값. */
  fields: Record<string, string>;
  /** 슬롯 id에 대응하는 IndexedDB 이미지 id. 아직 안 채운 슬롯은 키 자체가 없다. */
  slots: Record<string, string>;
}

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'texture'; assetUrl: string }
  | { type: 'photoBlur'; imageId: string; blur: number };

export interface Project {
  id: string;
  ratio: Ratio;
  background: Background;
  /** 깔아 둔 템플릿 카드. 배경과 같은 층위라 레이어 목록이 아니라 여기에 둔다. */
  template: ProjectTemplate | null;
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
