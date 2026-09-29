import { createImageResource, loadImageElement } from '@/utils/imageLoader';

/**
 * 스티커 에셋 이미지 캐시.
 *
 * 브라우저 HTTP 캐시가 있어도 매번 새 Image 객체를 만들면 디코딩이 다시 일어난다.
 * 같은 스티커를 여러 장 붙이는 것이 기본 사용 방식이라 디코딩 결과 자체를 공유해야 한다.
 */
export const assetImageResource = createImageResource((url) => loadImageElement(url, url));

/** 색과 주소를 한 키로 묶는다. 같은 낙서를 다른 색으로 붙이면 따로 디코딩해야 한다. */
export function tintedAssetKey(url: string, tint: string): string {
  return `${tint}|${url}`;
}

/**
 * 색을 입힌 에셋.
 *
 * 한 가지 색 에셋은 가져올 때 검정을 currentColor로 바꿔 두었다(scripts/assets).
 * img로 그리면 currentColor가 검정이라, 글을 받아 그 단어를 원하는 색으로 바꿔 끼운 뒤 다시 읽는다.
 * Blob URL 대신 data URL을 쓴다. Blob은 해제 시점을 따로 관리해야 하고, 너무 일찍 풀면
 * 캔버스가 다시 그릴 때 빈 그림이 된다.
 */
export const tintedAssetImageResource = createImageResource(async (key) => {
  const split = key.indexOf('|');
  const tint = key.slice(0, split);
  const url = key.slice(split + 1);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`에셋을 받지 못했다: ${url}`);
  const svg = (await response.text()).replaceAll('currentColor', tint);
  return loadImageElement(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, url);
});
