import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { downloadImage, exportFileName, shareImage } from './share';
import { exportStage, nextFrame, type ExportFormat, type ExportedImage } from './renderProject';
import { getRatioSize } from '@/layers/ratio';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';
import { logDebug } from '@/utils/debugLog';
import type { Ratio } from '@/layers/types';

/** 결과 문구를 띄워 두는 시간(ms). */
const STATUS_DURATION = 2500;

export interface ExportResult extends ExportedImage {
  /** 미리보기용 URL. 결과가 바뀌거나 화면을 닫을 때 반드시 해제한다. */
  previewUrl: string;
}

export interface ExportController {
  /** 렌더링 중 상태. 화면 전체를 덮는 스피너 대신 문구로만 알린다. */
  busy: boolean;
  /** 짧게 떴다 사라지는 안내 문구. */
  status: string | null;
  result: ExportResult | null;
  /** 다시 굽는다. 형식을 바꿀 때도 이 경로를 쓴다. */
  run: (format?: ExportFormat) => void;
  share: () => void;
  save: () => void;
  close: () => void;
}

/**
 * 완료 버튼이 하는 일 전부.
 *
 * 찍기 전에 선택을 풀고 한 프레임을 기다리는 것이 핵심이다.
 * 그러지 않으면 Transformer의 테두리와 핸들이 결과물에 그대로 찍힌다.
 *
 * 구운 결과는 바로 공유하지 않고 들고 있는다. 어떤 그림이 나갔는지 눈으로 확인하고
 * 저장할지 공유할지 고르는 편이, 공유 시트가 갑자기 뜨는 것보다 예측 가능하다.
 */
export function useExport(stage: Konva.Stage | null, ratio: Ratio | undefined): ExportController {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const clearSelection = useSelectionStore((state) => state.clear);
  const setExporting = useToolStore((state) => state.setExporting);

  const timer = useRef<number | null>(null);
  // 해제해야 할 URL을 ref로도 들고 있는다. 언마운트 시점에는 상태를 읽을 수 없다.
  const previewUrl = useRef<string | null>(null);

  const showStatus = useCallback((message: string | null) => {
    setStatus(message);
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (message === null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setStatus(null);
    }, STATUS_DURATION);
  }, []);

  const releasePreview = useCallback(() => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const run = useCallback(
    (format: ExportFormat = 'jpeg') => {
      if (!stage || !ratio || busy) return;

      void (async () => {
        setBusy(true);
        setStatus('고화질로 굽는 중');
        clearSelection();
        // 편집용 표시(선택 테두리, 빈 사진 자리의 더하기)가 결과물에 찍히지 않게 한 프레임을 기다린다
        setExporting(true);
        await nextFrame();

        try {
          const size = getRatioSize(ratio);
          const image = await exportStage(stage, size.width, size.height, format);
          releasePreview();
          const url = URL.createObjectURL(image.blob);
          previewUrl.current = url;
          setResult({ ...image, previewUrl: url });
          setStatus(null);
        } catch (error: unknown) {
          logDebug(`내보내기 실패: ${error instanceof Error ? error.message : String(error)}`);
          showStatus('내보내지 못했다');
        } finally {
          setExporting(false);
          setBusy(false);
        }
      })();
    },
    [stage, ratio, busy, clearSelection, setExporting, releasePreview, showStatus],
  );

  const share = useCallback(() => {
    if (!result) return;
    void shareImage(result.blob, exportFileName(result.format === 'png' ? 'png' : 'jpg'))
      .then((outcome) => {
        if (outcome === 'shared') showStatus('공유했다');
        else if (outcome === 'downloaded') showStatus('저장했다');
      })
      .catch((error: unknown) => {
        logDebug(`공유 실패: ${error instanceof Error ? error.message : String(error)}`);
        showStatus('공유하지 못했다');
      });
  }, [result, showStatus]);

  const save = useCallback(() => {
    if (!result) return;
    downloadImage(result.blob, exportFileName(result.format === 'png' ? 'png' : 'jpg'));
    showStatus('저장했다');
  }, [result, showStatus]);

  const close = useCallback(() => {
    releasePreview();
    setResult(null);
    setStatus(null);
  }, [releasePreview]);

  return { busy, status, result, run, share, save, close };
}
