import { useEffect, useState } from 'react';
import { useSaveStatusStore, type SaveStatus } from '@/store/saveStatusStore';

/** 저장 시각을 다시 계산하는 주기. 초 단위까지 보여줄 이유가 없다. */
const TICK = 20_000;

/** 상단 바는 자리가 좁다. 문구가 길면 버튼이 밀려 두 줄이 된다. */
function describe(status: SaveStatus, savedAt: number | null, now: number): string {
  if (status === 'saving') return '저장 중';
  if (status === 'failed') return '저장 실패';
  if (status === 'saved' && savedAt !== null) {
    const minutes = Math.floor((now - savedAt) / 60_000);
    return minutes < 1 ? '방금 저장됨' : `${minutes}분 전`;
  }
  return '자동저장';
}

/**
 * 자동 저장 표시.
 *
 * 저장 버튼이 없는 앱에서는 "저장됐나?"라는 불안이 남는다.
 * 조용히 저장하되 그 사실만은 계속 보여 준다.
 */
export default function SaveStatusChip() {
  const status = useSaveStatusStore((state) => state.status);
  const savedAt = useSaveStatusStore((state) => state.savedAt);
  const [now, setNow] = useState(() => Date.now());

  // 저장 시각은 가만히 있어도 낡는다. 화면에 남은 동안 주기적으로 다시 센다.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK);
    return () => window.clearInterval(timer);
  }, []);

  const failed = status === 'failed';

  return (
    <span className="ml-0.5 flex min-w-0 items-center gap-1.5 rounded-full bg-surface-lowest px-2.5 py-1">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          failed ? 'bg-error' : 'bg-secondary shadow-[0_0_8px_rgba(64,226,168,0.8)]'
        }`}
      />
      <span
        className={`truncate text-label-sm whitespace-nowrap ${
          failed ? 'text-error' : 'text-on-surface-variant'
        }`}
      >
        {describe(status, savedAt, now)}
      </span>
    </span>
  );
}
