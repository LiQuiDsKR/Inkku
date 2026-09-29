import { create } from 'zustand';
import { useProjectStore } from './projectStore';
import { useSettingsStore } from './settingsStore';

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

  select: (id) => {
    set({ selectedId: id });

    /*
     * 고른 것을 맨 위로 올리는 설정.
     * 히스토리에는 남기지 않는다. 고르는 일은 편집이 아니라서, 기록하면
     * 요소를 몇 번 두드리는 것만으로 30단계가 다 차서 실행취소가 쓸모없어진다.
     */
    if (id && useSettingsStore.getState().autoFront) {
      useProjectStore.getState().reorderLayer(id, 'front', false);
    }
  },

  clear: () => set({ selectedId: null }),
}));
