import { createImageResource, loadImageElement } from '@/utils/imageLoader';

/**
 * 스티커 에셋 이미지 캐시.
 *
 * 브라우저 HTTP 캐시가 있어도 매번 새 Image 객체를 만들면 디코딩이 다시 일어난다.
 * 같은 스티커를 여러 장 붙이는 것이 기본 사용 방식이라 디코딩 결과 자체를 공유해야 한다.
 */
export const assetImageResource = createImageResource((url) => loadImageElement(url, url));
