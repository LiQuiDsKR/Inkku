/**
 * 이미지 디코딩과 캐시.
 *
 * 사진(IndexedDB Blob)과 스티커(정적 URL)는 출처만 다르고 캐시 규칙은 같다.
 * 캐시 로직을 두 벌 만들면 한쪽만 고치는 실수가 나므로 여기서 한 번만 정의한다.
 */

export interface ImageResource {
  /** 이미 캐시에 있으면 즉시 준다. 첫 렌더에서 깜빡임을 없애는 데 쓴다. */
  peek: (key: string) => HTMLImageElement | null;
  load: (key: string) => Promise<HTMLImageElement>;
}

/**
 * decode()를 쓰지 않는다. 문서가 화면에 안 그려지는 상태(백그라운드 탭, 화면 꺼짐)에서는
 * 페인트를 기다리며 영영 resolve되지 않는다. 그러면 레이어가 크기 0으로 남아
 * 보이지도 않고 눌리지도 않는다. onload는 렌더와 무관하게 발생한다.
 */
export function loadImageElement(src: string, label: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지 디코딩 실패: ${label}`));
    image.src = src;
  });
}

export function createImageResource(
  loader: (key: string) => Promise<HTMLImageElement>,
): ImageResource {
  const cache = new Map<string, HTMLImageElement>();
  const pending = new Map<string, Promise<HTMLImageElement>>();

  return {
    peek: (key) => cache.get(key) ?? null,

    load: (key) => {
      const cached = cache.get(key);
      if (cached) return Promise.resolve(cached);

      // 같은 이미지를 쓰는 레이어가 여럿이면 요청이 중복된다. 진행 중인 약속을 공유한다.
      const inFlight = pending.get(key);
      if (inFlight) return inFlight;

      const promise = loader(key)
        .then((image) => {
          cache.set(key, image);
          pending.delete(key);
          return image;
        })
        .catch((error: unknown) => {
          // 실패를 캐시에 남기면 재시도할 수 없다. 다음 마운트에서 다시 시도하게 지운다.
          pending.delete(key);
          throw error;
        });

      pending.set(key, promise);
      return promise;
    },
  };
}
