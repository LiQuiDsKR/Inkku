import type Konva from 'konva';

/**
 * 고해상도 내보내기.
 *
 * 편집 중에는 화면 크기에 맞춰 축소한 캔버스를 쓴다. 내보낼 때만 배율을 올려 다시 그린다.
 * 편집 캔버스를 처음부터 크게 잡으면 iOS 사파리의 캔버스 메모리 제한에 걸려 탭이 죽는다.
 */

/** 결과물의 긴 변 픽셀. 인스타 업로드 기준으로 충분하고, 낙서를 구운 배율(2배)과도 맞는다. */
export const EXPORT_LONG_EDGE = 2160;

/** JPEG 품질. 0.95를 넘기면 용량만 커지고 눈으로는 차이가 없다. */
const JPEG_QUALITY = 0.92;

/**
 * 결과 파일 형식.
 * 배경이 항상 캔버스를 덮으므로 투명도는 필요 없다. 기본은 용량이 훨씬 작은 JPEG다.
 * PNG는 글자와 선의 경계가 뭉개지지 않아서 화면 캡처처럼 또렷한 결과가 필요할 때 쓴다.
 */
export type ExportFormat = 'jpeg' | 'png';

export interface ExportedImage {
  blob: Blob;
  width: number;
  height: number;
  format: ExportFormat;
}

function toBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('결과 이미지를 만들지 못했다'));
      },
      format === 'png' ? 'image/png' : 'image/jpeg',
      format === 'png' ? undefined : JPEG_QUALITY,
    );
  });
}

/** 다음 프레임까지 기다린다. 선택 해제 같은 화면 변화가 캔버스에 반영된 뒤에 찍어야 한다. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * 스테이지를 그대로 다시 그려 이미지로 만든다.
 *
 * Konva는 pixelRatio에 스테이지의 현재 배율을 곱해서 그린다.
 * 그래서 화면 배율을 나눠 주지 않으면 축소된 화면 크기 그대로 나온다.
 */
export async function exportStage(
  stage: Konva.Stage,
  logicalWidth: number,
  logicalHeight: number,
  format: ExportFormat = 'jpeg',
): Promise<ExportedImage> {
  const stageScale = stage.scaleX() || 1;
  const targetScale = EXPORT_LONG_EDGE / Math.max(logicalWidth, logicalHeight);
  const pixelRatio = targetScale / stageScale;

  const canvas = stage.toCanvas({ pixelRatio });
  try {
    return {
      blob: await toBlob(canvas, format),
      width: canvas.width,
      height: canvas.height,
      format,
    };
  } finally {
    // 2160픽셀 캔버스는 20MB가 넘는다. 다 쓰면 즉시 반납해야 다음 내보내기가 실패하지 않는다.
    canvas.width = 0;
    canvas.height = 0;
  }
}
