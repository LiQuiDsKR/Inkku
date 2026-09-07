import { getImage } from '@/storage/imageStore';
import { createImageResource, loadImageElement } from '@/utils/imageLoader';
import { useImageResource } from './useImageResource';

/**
 * IndexedDB에 저장된 사진과 굳힌 낙서를 디코딩해 캐시한다.
 * 레이어가 리렌더될 때마다 DB를 다시 읽고 디코딩하면 제스처 중에 프레임이 통째로 날아간다.
 */
const photoResource = createImageResource(async (imageId) => {
  const record = await getImage(imageId);
  if (!record) {
    throw new Error(`이미지를 찾지 못했다: ${imageId}`);
  }

  const url = URL.createObjectURL(record.blob);
  try {
    return await loadImageElement(url, imageId);
  } finally {
    // 로드가 끝나면 픽셀은 이미지 객체가 들고 있다. URL을 붙들고 있으면 Blob이 해제되지 않는다.
    URL.revokeObjectURL(url);
  }
});

export function useLayerImage(imageId: string): HTMLImageElement | null {
  return useImageResource(photoResource, imageId);
}
