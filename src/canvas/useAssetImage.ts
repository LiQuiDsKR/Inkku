import { assetImageResource, tintedAssetImageResource, tintedAssetKey } from '@/assets/assetImages';
import { resolveAssetUrl } from '@/assets/assetPacks';
import { useImageResource } from './useImageResource';

/**
 * 스티커와 프리셋 선처럼 정적 URL로 오는 에셋. 사진과 달리 여러 레이어가 같은 URL을 공유한다.
 * 색을 입힌 에셋은 색마다 따로 디코딩한 그림을 쓴다.
 */
export function useAssetImage(url: string, tint?: string): HTMLImageElement | null {
  // 저장된 주소는 만들 당시의 배포 경로를 담고 있다. 지금 경로로 다시 맞춘다
  const resolved = resolveAssetUrl(url);
  return useImageResource(
    tint ? tintedAssetImageResource : assetImageResource,
    tint ? tintedAssetKey(resolved, tint) : resolved,
  );
}
