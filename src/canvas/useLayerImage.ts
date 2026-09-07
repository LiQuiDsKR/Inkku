import { useEffect, useState } from 'react';
import { getImage } from '@/storage/imageStore';
import { logDebug } from '@/utils/debugLog';

/**
 * 디코딩된 이미지를 모듈 전역에 캐시한다.
 * 레이어가 리렌더될 때마다 IndexedDB를 다시 읽고 디코딩하면
 * 제스처 중에 프레임이 통째로 날아간다.
 */
const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

async function loadImage(imageId: string): Promise<HTMLImageElement> {
  const record = await getImage(imageId);
  if (!record) {
    throw new Error(`이미지를 찾지 못했다: ${imageId}`);
  }

  const url = URL.createObjectURL(record.blob);
  try {
    // decode()를 쓰면 안 된다. 문서가 화면에 안 그려지는 상태(백그라운드 탭, 화면 꺼짐)에서는
    // 페인트를 기다리며 영영 resolve되지 않는다. 그러면 레이어가 크기 0으로 남아
    // 보이지도 않고 눌리지도 않는다. onload는 렌더와 무관하게 발생한다.
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`이미지 디코딩 실패: ${imageId}`));
      image.src = url;
    });
    return image;
  } finally {
    // 로드가 끝나면 픽셀은 이미지 객체가 들고 있다. URL을 붙들고 있으면 Blob이 해제되지 않는다.
    URL.revokeObjectURL(url);
  }
}

export function useLayerImage(imageId: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => cache.get(imageId) ?? null);

  useEffect(() => {
    const cached = cache.get(imageId);
    if (cached) {
      setImage(cached);
      return;
    }

    let alive = true;

    // 같은 이미지를 쓰는 레이어가 여럿이면 요청이 중복된다. 진행 중인 약속을 공유한다.
    let promise = pending.get(imageId);
    if (!promise) {
      promise = loadImage(imageId);
      pending.set(imageId, promise);
    }

    promise
      .then((loaded) => {
        cache.set(imageId, loaded);
        pending.delete(imageId);
        if (alive) setImage(loaded);
      })
      .catch((error: unknown) => {
        pending.delete(imageId);
        logDebug(error instanceof Error ? error.message : String(error));
      });

    return () => {
      alive = false;
    };
  }, [imageId]);

  return image;
}
