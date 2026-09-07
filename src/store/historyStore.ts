import { create } from 'zustand';
import type { ProjectSnapshot } from '@/layers/snapshot';

/** 30단계면 폰 메모리에서 안전하면서도 실수를 되돌리기에 충분하다. */
export const MAX_HISTORY = 30;

interface HistoryState {
  past: readonly ProjectSnapshot[];
  future: readonly ProjectSnapshot[];
  /** 변경 직전 상태를 쌓는다. 새 변경이 생기면 다시실행 줄기는 버린다. */
  record: (snapshot: ProjectSnapshot) => void;
  /** 되돌릴 스냅샷을 꺼내고 현재 상태를 다시실행 쪽으로 넘긴다. */
  undo: (current: ProjectSnapshot) => ProjectSnapshot | null;
  redo: (current: ProjectSnapshot) => ProjectSnapshot | null;
  reset: () => void;
}

/**
 * 히스토리를 프로젝트 스토어와 분리한다.
 * 한 파일에 넣으면 모든 액션이 과거/미래 배열까지 신경 써야 해서 실수가 늘고,
 * 스토어 파일이 250줄 제한을 금방 넘긴다.
 */
export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  record: (snapshot) =>
    set((state) => ({
      // 오래된 것부터 버린다. 30단계를 넘겨서 남겨 봐야 UI에서 접근할 수 없다.
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })),

  undo: (current) => {
    const { past, future } = get();
    const previous = past[past.length - 1];
    if (!previous) return null;
    set({ past: past.slice(0, -1), future: [current, ...future].slice(0, MAX_HISTORY) });
    return previous;
  },

  redo: (current) => {
    const { past, future } = get();
    const next = future[0];
    if (!next) return null;
    set({ past: [...past, current].slice(-MAX_HISTORY), future: future.slice(1) });
    return next;
  },

  reset: () => set({ past: [], future: [] }),
}));

export function useCanUndo(): boolean {
  return useHistoryStore((state) => state.past.length > 0);
}

export function useCanRedo(): boolean {
  return useHistoryStore((state) => state.future.length > 0);
}
