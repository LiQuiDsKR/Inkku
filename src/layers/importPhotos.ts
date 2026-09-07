import { putImage } from '@/storage/imageStore';
import { resizeImageFile } from '@/utils/imageResize';
import { createId } from '@/utils/id';
import { createPhotoLayer } from './factory';
import type { PhotoLayer } from './types';

export interface ImportPhotosParams {
  files: readonly File[];
  canvasWidth: number;
  canvasHeight: number;
  startZIndex: number;
  /** 여러 장 처리 중 진행 상황. 장수가 많으면 몇 초가 걸려서 표시가 필요하다. */
  onProgress?: (done: number, total: number) => void;
}

/**
 * 파일을 줄여 IndexedDB에 넣고 사진 레이어를 만든다.
 *
 * 한 장씩 순서대로 처리한다. Promise.all로 동시에 돌리면
 * 고해상도 사진 여러 장의 디코딩 버퍼가 한꺼번에 잡혀서
 * iOS 사파리가 탭을 통째로 죽인다.
 */
export async function importPhotos(params: ImportPhotosParams): Promise<PhotoLayer[]> {
  const { files, canvasWidth, canvasHeight, startZIndex, onProgress } = params;
  const layers: PhotoLayer[] = [];

  for (const [index, file] of files.entries()) {
    const resized = await resizeImageFile(file);
    const imageId = createId();

    await putImage({
      id: imageId,
      blob: resized.blob,
      width: resized.width,
      height: resized.height,
      createdAt: Date.now(),
    });

    layers.push(
      createPhotoLayer({
        imageId,
        naturalWidth: resized.width,
        naturalHeight: resized.height,
        canvasWidth,
        canvasHeight,
        zIndex: startZIndex + index,
        cascadeIndex: index,
      }),
    );

    onProgress?.(index + 1, files.length);
  }

  return layers;
}
