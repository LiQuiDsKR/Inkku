import type { PhotoLayer, PhotoMask } from './types';

/**
 * 도형으로 자른 사진의 프레임과 잘라 낼 영역 계산.
 *
 * 캔버스(Konva)와 손가락 제스처가 같은 계산을 써야 한다.
 * 그리는 쪽과 미는 쪽이 각자 계산하면, 끈 만큼 움직이지 않고 사진이 미끄러진다.
 */

/** 자르기 배율의 아래 한계. 1보다 작으면 도형 안에 빈 자리가 생긴다. */
export const MIN_MASK_ZOOM = 1;

/** 위 한계. 더 키우면 원본 화소가 늘어나 뭉개진다. */
export const MAX_MASK_ZOOM = 4;

export interface Size {
  width: number;
  height: number;
}

export interface Offset {
  x: number;
  y: number;
}

export const CENTER_OFFSET: Offset = { x: 0, y: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 자른 사진이 정사각형으로 놓이는지.
 *
 * 둥근 사각형만 원래 비율을 지킨다. 하트나 별을 가로로 긴 사진에 맞춰 늘이면
 * 하트가 아니라 찌그러진 무언가가 된다. 나머지는 정사각형 프레임에 담는다.
 */
export function masksToSquare(mask: PhotoMask): boolean {
  return mask !== 'rounded';
}

/** 도형이 차지하는 자리(논리 좌표). 자르지 않은 사진은 프레임이 없다. */
export function maskFrame(layer: PhotoLayer): Size | null {
  if (!layer.mask) return null;
  if (!masksToSquare(layer.mask)) {
    return { width: layer.naturalWidth, height: layer.naturalHeight };
  }
  const side = Math.min(layer.naturalWidth, layer.naturalHeight);
  return { width: side, height: side };
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropFit {
  crop: CropRect;
  /** 밀 수 있는 여유(원본 픽셀). 0이면 그 축으로는 움직일 것이 없다. */
  slackX: number;
  slackY: number;
}

/**
 * 원본에서 떼어 올 영역.
 *
 * 프레임을 꽉 채우는 가장 큰 사각형을 잡고, 배율만큼 좁힌 뒤 오프셋만큼 민다.
 * 좁은 쪽 변에 맞추기 때문에 배율이 1이어도 가로로 긴 사진은 좌우로 밀 여유가 남는다.
 */
export function cropFit(source: Size, frame: Size, zoom = 1, offset = CENTER_OFFSET): CropFit {
  const scale = clamp(zoom, MIN_MASK_ZOOM, MAX_MASK_ZOOM);
  const frameAspect = frame.width / frame.height;

  const wide = source.width / source.height > frameAspect;
  const height = (wide ? source.height : source.width / frameAspect) / scale;
  const width = height * frameAspect;

  const slackX = Math.max(0, source.width - width);
  const slackY = Math.max(0, source.height - height);

  return {
    crop: {
      x: (slackX / 2) * (1 + clamp(offset.x, -1, 1)),
      y: (slackY / 2) * (1 + clamp(offset.y, -1, 1)),
      width,
      height,
    },
    slackX,
    slackY,
  };
}

/**
 * 프레임 좌표로 민 거리를 오프셋 값으로 바꾼다.
 *
 * 사진을 오른쪽으로 밀면 보이는 창은 왼쪽으로 간다. 그래서 부호가 뒤집힌다.
 * 밀 여유가 없는 축은 아무리 끌어도 0이다(사진이 도형을 벗어나면 빈 자리가 생긴다).
 */
export function offsetAfterDrag(
  current: Offset,
  fit: CropFit,
  frame: Size,
  dragX: number,
  dragY: number,
): Offset {
  const stepX = fit.slackX > 0 ? (2 * dragX * (fit.crop.width / frame.width)) / fit.slackX : 0;
  const stepY = fit.slackY > 0 ? (2 * dragY * (fit.crop.height / frame.height)) / fit.slackY : 0;

  return {
    x: clamp(current.x - stepX, -1, 1),
    y: clamp(current.y - stepY, -1, 1),
  };
}

export function clampZoom(zoom: number): number {
  return clamp(zoom, MIN_MASK_ZOOM, MAX_MASK_ZOOM);
}
