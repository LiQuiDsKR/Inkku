/** 업로드 사진의 긴 변 상한. 내보내기 해상도와 같은 값이라 확대해도 화질이 모자라지 않는다. */
export const MAX_LONG_EDGE = 2160;

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

export function fitLongEdge(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height };
  }
  const ratio = maxLongEdge / longEdge;
  // 반올림으로 0이 되면 캔버스 생성이 실패하므로 최소 1을 보장한다
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // 폰 사진은 EXIF 회전 정보를 갖고 있다. 이 옵션이 없으면 세로 사진이 눕는다.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // 구형 사파리는 옵션 인자를 거부한다. 회전은 틀릴 수 있어도 동작은 시킨다.
    return createImageBitmap(file);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('캔버스를 Blob으로 바꾸지 못했다'));
      },
      type,
      quality,
    );
  });
}

/**
 * 원본 그대로 저장하면 최신 폰의 5000px 사진이 IndexedDB를 금방 채우고,
 * 캔버스에 올리는 순간 iOS의 캔버스 메모리 제한에 걸린다. 저장 전에 줄인다.
 */
export async function resizeImageFile(
  file: File,
  maxLongEdge: number = MAX_LONG_EDGE,
): Promise<ResizedImage> {
  const bitmap = await decode(file);
  const size = fitLongEdge(bitmap.width, bitmap.height, maxLongEdge);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('2D 컨텍스트를 얻지 못했다');
  }

  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  // 디코딩 버퍼를 즉시 반납한다. 여러 장을 연속으로 올릴 때 메모리가 누적되는 걸 막는다.
  bitmap.close();

  const blob = await toBlob(canvas, 'image/jpeg', 0.9);

  // 캔버스 크기를 0으로 만들어 백킹 스토어를 회수한다. iOS에서 특히 효과가 크다.
  canvas.width = 0;
  canvas.height = 0;

  return { blob, width: size.width, height: size.height };
}
