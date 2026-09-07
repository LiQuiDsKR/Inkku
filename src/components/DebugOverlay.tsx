import { useState, useSyncExternalStore } from 'react';
import {
  clearDebug,
  getDebugEntries,
  getDebugWatches,
  subscribeDebug,
  type DebugEntry,
} from '@/utils/debugLog';

/**
 * 실기기 확인용 오버레이. 개발 빌드에서만 렌더한다.
 * 아이폰은 Windows에서 원격 디버깅이 안 되므로 에러와 제스처 수치를 여기로 본다.
 */
export default function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const entries = useSyncExternalStore(subscribeDebug, getDebugEntries);
  const watches = useSyncExternalStore(subscribeDebug, getDebugWatches);

  const errorCount = entries.filter((entry) => entry.kind === 'error').length;

  return (
    // 하단 툴바 위로 띄운다. bottom-0에 두면 사진 버튼과 겹쳐 눌러진다.
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-start p-2">
      {open && <DebugPanel entries={entries} watches={watches} />}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`pointer-events-auto rounded-full px-3 py-1 text-[11px] font-mono ${
          errorCount > 0 ? 'bg-ink-accent text-white' : 'bg-ink-panel/80 text-ink-muted'
        }`}
      >
        {errorCount > 0 ? `debug (${errorCount})` : 'debug'}
      </button>
    </div>
  );
}

interface DebugPanelProps {
  entries: readonly DebugEntry[];
  watches: Readonly<Record<string, string>>;
}

function DebugPanel({ entries, watches }: DebugPanelProps) {
  const watchKeys = Object.keys(watches);

  return (
    <div className="pointer-events-auto mb-2 max-h-[40vh] w-full overflow-y-auto rounded-lg bg-black/85 p-2 font-mono text-[11px] leading-snug">
      {watchKeys.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-x-3 border-b border-ink-line pb-2">
          {watchKeys.map((key) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="text-ink-muted">{key}</span>
              <span className="truncate">{watches[key]}</span>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-ink-muted">기록 없음</p>
      ) : (
        entries.map((entry) => (
          <p
            key={entry.id}
            className={entry.kind === 'error' ? 'break-words text-ink-accent' : 'break-words'}
          >
            {entry.message}
          </p>
        ))
      )}

      <button
        type="button"
        onClick={clearDebug}
        className="mt-2 rounded bg-ink-panel px-2 py-1 text-ink-muted"
      >
        지우기
      </button>
    </div>
  );
}
