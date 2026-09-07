import { assetImageResource } from '@/assets/assetImages';
import { useImageResource } from './useImageResource';

/** 스티커와 프리셋 선처럼 정적 URL로 오는 에셋. 사진과 달리 여러 레이어가 같은 URL을 공유한다. */
export function useAssetImage(url: string): HTMLImageElement | null {
  return useImageResource(assetImageResource, url);
}
