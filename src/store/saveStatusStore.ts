import { create } from 'zustand';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface SaveStatusState {
  status: SaveStatus;
  /** 마지막으로 저장이 끝난 시각. 상단 바에 "방금 전"을 계산하는 데 쓴다. */
  savedAt: number | null;
  setStatus: (status: SaveStatus) => void;
}

/**
 * 자동 저장 상태.
 *
 * 저장은 조용히 일어나지만 사용자는 그 사실을 알아야 안심하고 앱을 닫는다.
 * 프로젝트 데이터가 아니라 화면에 보여줄 상태라 히스토리와 분리한다.
 */
export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  savedAt: null,
  setStatus: (status) =>
    set(status === 'saved' ? { status, savedAt: Date.now() } : { status }),
}));
