/**
 * 레이어와 이미지 식별자 생성.
 * crypto.randomUUID는 secure context에서만 있다. USB 포트 포워딩(localhost)과
 * 터널(https)은 모두 secure context라 개발 중에도 정상이지만,
 * 혹시 http로 접속한 경우에도 앱이 죽지 않도록 폴백을 둔다.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
