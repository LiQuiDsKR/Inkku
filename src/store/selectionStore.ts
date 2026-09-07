import { create } from 'zustand';

interface SelectionState {
  selectedId: string | null;
  select: (id: string | null) => void;
  clear: () => void;
}

/**
 * 선택 상태를 프로젝트 스토어와 분리한다.
 * 히스토리 스냅샷은 프로젝트만 담는데, 선택이 섞여 있으면
 * 실행취소가 "선택을 되돌리는" 무의미한 단계를 만든다.
 */
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedId: null,
  select: (id) => set({ selectedId: id }),
  clear: () => set({ selectedId: null }),
}));
