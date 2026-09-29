import { useEffect, useState } from 'react';
import type { ImageResource } from '@/utils/imageLoader';
import { logDebug } from '@/utils/debugLog';

/**
 * 이미지 리소스를 구독하는 공통 훅.
 * 캐시에 있으면 첫 렌더에서 바로 준다. 그래야 실행취소로 레이어가 되살아날 때 깜빡이지 않는다.
 */
export function useImageResource(resource: ImageResource, key: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => resource.peek(key));

  useEffect(() => {
    // 키가 비어 있으면 아직 고르지 않은 자리다(템플릿의 빈 사진 슬롯).
    // 빈 키로 DB를 두드리면 매번 "찾지 못했다" 오류만 쌓인다.
    if (!key) {
      setImage(null);
      return;
    }

    const cached = resource.peek(key);
    if (cached) {
      setImage(cached);
      return;
    }

    // 키가 바뀌는 순간 이전 이미지를 지운다. 남겨 두면 새 이미지가 올 때까지 엉뚱한 그림이 보인다.
    setImage(null);

    let alive = true;
    resource
      .load(key)
      .then((loaded) => {
        if (alive) setImage(loaded);
      })
      .catch((error: unknown) => {
        logDebug(error instanceof Error ? error.message : String(error));
      });

    return () => {
      alive = false;
    };
  }, [resource, key]);

  return image;
}
