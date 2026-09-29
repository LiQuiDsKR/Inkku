import { useCallback, useEffect, useState } from 'react';
import { loadAssetPack, type AssetPack } from './assetPacks';
import { logDebug } from '@/utils/debugLog';

interface PackState {
  packId: string;
  pack: AssetPack | null;
  failed: boolean;
}

export interface AssetPackView {
  pack: AssetPack | null;
  failed: boolean;
  retry: () => void;
}

/** 탭을 열 때 팩 목록을 받는다. 실패하면 다시 시도할 수 있게 한다(지하철에서 여는 일이 흔하다). */
export function useAssetPack(packId: string): AssetPackView {
  const [state, setState] = useState<PackState>({ packId, pack: null, failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ packId, pack: null, failed: false });

    loadAssetPack(packId)
      .then((pack) => {
        if (alive) setState({ packId, pack, failed: false });
      })
      .catch((error: unknown) => {
        logDebug(error instanceof Error ? error.message : String(error));
        if (alive) setState({ packId, pack: null, failed: true });
      });

    return () => {
      alive = false;
    };
  }, [packId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  // 팩을 바꾼 직후 한 번은 이전 팩의 상태가 남아 있다. 그 한 프레임에 엉뚱한 목록이 보이지 않게 한다
  const current = state.packId === packId ? state : null;
  return { pack: current?.pack ?? null, failed: current?.failed ?? false, retry };
}
