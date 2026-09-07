/**
 * 개발용 로그 버퍼.
 *
 * Windows에서는 아이폰 사파리에 웹 인스펙터를 붙일 수 없다.
 * 실기기 확인 중 에러가 나도 흰 화면 말고는 아무 정보를 볼 수 없어서,
 * 에러와 제스처 수치를 화면에 직접 띄우는 경로를 따로 만든다.
 */

export type DebugKind = 'log' | 'error';

export interface DebugEntry {
  id: number;
  kind: DebugKind;
  message: string;
}

/** 폰 화면을 다 덮지 않을 만큼만 남긴다. */
const MAX_ENTRIES = 40;

let entries: readonly DebugEntry[] = [];
let watches: Readonly<Record<string, string>> = {};
let nextId = 0;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * watch 값은 제스처 도중 매 프레임 바뀐다.
 * 그때마다 리렌더하면 오버레이가 측정 대상인 제스처 성능을 오히려 갉아먹으므로
 * 프레임 단위로 합쳐서 통지한다.
 */
let framePending = false;
function emitOnNextFrame(): void {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => {
    framePending = false;
    emit();
  });
}

export function subscribeDebug(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDebugEntries(): readonly DebugEntry[] {
  return entries;
}

export function getDebugWatches(): Readonly<Record<string, string>> {
  return watches;
}

function push(kind: DebugKind, message: string): void {
  entries = [...entries.slice(-(MAX_ENTRIES - 1)), { id: nextId++, kind, message }];
  emit();
}

export function logDebug(message: string): void {
  if (!import.meta.env.DEV) return;
  push('log', message);
}

/** 매 프레임 바뀌는 값은 쌓지 않고 키 단위로 덮어쓴다. 안 그러면 버퍼가 즉시 넘친다. */
export function watchDebug(key: string, value: string | number): void {
  if (!import.meta.env.DEV) return;
  watches = { ...watches, [key]: String(value) };
  emitOnNextFrame();
}

export function clearDebug(): void {
  entries = [];
  watches = {};
  emit();
}

/** 무엇이 던져질지 모르므로 unknown으로 받고 좁혀서 문자열로 만든다. */
function describe(reason: unknown): string {
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`;
  }
  if (typeof reason === 'string') return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

let captureInstalled = false;

/** 전역 에러를 오버레이로 끌어온다. 폰에서 콘솔을 못 보기 때문에 이 경로가 유일한 단서다. */
export function installDebugErrorCapture(): void {
  if (captureInstalled || !import.meta.env.DEV) return;
  captureInstalled = true;

  window.addEventListener('error', (event: ErrorEvent) => {
    push('error', describe(event.error ?? event.message));
  });
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    push('error', describe(event.reason));
  });
}
