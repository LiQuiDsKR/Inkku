import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { exportFileName, shareImage } from './share';
import { exportStage, nextFrame } from './renderProject';
import { getRatioSize } from '@/layers/ratio';
import { useSelectionStore } from '@/store/selectionStore';
import { logDebug } from '@/utils/debugLog';
import type { Ratio } from '@/layers/types';

/** 결과 문구를 띄워 두는 시간(ms). */
const STATUS_DURATION = 2500;

export interface ExportController {
  status: string | null;
  busy: boolean;
  run: () => void;
}

/**
 * 완료 버튼이 하는 일 전부.
 *
 * 찍기 전에 선택을 풀고 한 프레임을 기다리는 것이 핵심이다.
 * 그러지 않으면 Transformer의 빨간 테두리와 핸들이 결과물에 그대로 찍힌다.
 */
export function useExport(stage: Konva.Stage | null, ratio: Ratio | undefined): ExportController {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clearSelection = useSelectionStore((state) => state.clear);

  const timer = useRef<number | null>(null);

  const showStatus = useCallback((message: string | null) => {
    setStatus(message);
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (message === null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setStatus(null);
    }, STATUS_DURATION);
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const run = useCallback(() => {
    if (!stage || !ratio || busy) return;

    void (async () => {
      setBusy(true);
      setStatus('내보내는 중');
      clearSelection();
      await nextFrame();

      try {
        const size = getRatioSize(ratio);
        const image = await exportStage(stage, size.width, size.height);
        const outcome = await shareImage(image.blob, exportFileName());
        showStatus(
          outcome === 'shared' ? '공유했다' : outcome === 'downloaded' ? '저장했다' : null,
        );
      } catch (error: unknown) {
        logDebug(`내보내기 실패: ${error instanceof Error ? error.message : String(error)}`);
        showStatus('내보내지 못했다');
      } finally {
        setBusy(false);
      }
    })();
  }, [stage, ratio, busy, clearSelection, showStatus]);

  return { status, busy, run };
}
