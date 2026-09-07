/**
 * 결과물 내보내기.
 *
 * iOS에는 다운로드 폴더가 없다. 링크로 저장하면 사파리가 파일을 어디에도 남기지 못하거나
 * 사용자가 찾지 못한다. 그래서 주 경로는 공유 시트이고 다운로드는 폴백이다.
 */

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // 즉시 해제하면 사파리가 저장을 시작하기 전에 URL이 사라진다. 한 틱 뒤에 지운다.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareImage(blob: Blob, fileName: string): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: blob.type });

  // canShare로 먼저 물어봐야 한다. share만 있고 파일 공유는 못 하는 브라우저가 있다.
  const canShareFiles =
    typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error: unknown) {
      // 사용자가 공유 시트를 닫은 것은 실패가 아니다. 다운로드로 떨어뜨리면 원치 않는 파일이 생긴다.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // 그 밖의 실패는 저장이라도 되게 폴백한다
    }
  }

  download(blob, fileName);
  return 'downloaded';
}

/** 파일 이름에 시각을 넣어 여러 장을 저장해도 덮어쓰지 않게 한다. */
export function exportFileName(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `inkku-${stamp}.jpg`;
}
