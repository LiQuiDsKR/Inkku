import { putImage } from '@/storage/imageStore';
import { createId } from '@/utils/id';
import { RASTER_SCALE, rasterizeStroke } from '@/utils/strokeRaster';
import type { Point } from '@/canvas/gestureMath';
import type { DrawingLayer } from './types';

export interface CommitStrokeParams {
  points: readonly Point[];
  color: string;
  strokeWidth: number;
  zIndex: number;
}

/**
 * 그린 획을 이미지로 굳혀 낙서 레이어로 만든다.
 *
 * 획 하나가 레이어 하나다. 여러 획을 한 레이어로 묶으면 방금 그은 것만 지우기가 어렵고,
 * 굳히는 시점도 애매해진다. 실행취소 한 번에 획 하나가 사라지는 편이 예상과 맞는다.
 */
export async function commitStroke(params: CommitStrokeParams): Promise<DrawingLayer | null> {
  const raster = await rasterizeStroke(params.points, params.color, params.strokeWidth);
  if (!raster) return null;

  const imageId = createId();
  await putImage({
    id: imageId,
    blob: raster.blob,
    // 저장 레코드의 크기는 실제 픽셀 수다. 논리 크기는 레이어가 따로 들고 있다.
    width: Math.round(raster.width * RASTER_SCALE),
    height: Math.round(raster.height * RASTER_SCALE),
    createdAt: Date.now(),
  });

  return {
    id: createId(),
    type: 'drawing',
    // 굳힌 획의 한가운데를 레이어 원점으로 삼는다. 회전축이 획 중심이어야 자연스럽다.
    x: raster.x + raster.width / 2,
    y: raster.y + raster.height / 2,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    zIndex: params.zIndex,
    imageId,
    width: raster.width,
    height: raster.height,
  };
}
