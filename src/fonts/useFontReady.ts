import { useEffect, useState } from 'react';
import { ensureFont } from './loadFont';

/**
 * 폰트 로드가 끝날 때마다 값이 바뀌는 토큰.
 *
 * 불린으로 주면 이미 받은 폰트에서는 값이 그대로라 캔버스가 다시 그려지지 않는다.
 * 숫자를 올려 주면 폰트가 바뀔 때마다 재측정 effect가 확실히 한 번 더 돈다.
 */
export function useFontReady(fontId: string, sample: string): number {
  const [token, setToken] = useState(0);

  useEffect(() => {
    let alive = true;
    void ensureFont(fontId, sample).then(() => {
      if (alive) setToken((value) => value + 1);
    });
    return () => {
      alive = false;
    };
  }, [fontId, sample]);

  return token;
}
