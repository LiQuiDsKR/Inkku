import { create } from 'zustand';
import { createId } from '@/utils/id';
import { getRatioSize } from '@/layers/ratio';
import {
  duplicateLayerById,
  patchBaseLayer,
  patchTextLayer,
  removeLayerById,
} from '@/layers/mutations';
import { nextZIndex, reorderLayers, type ReorderCommand } from '@/layers/order';
import { applySnapshot, isSameLayerList, takeSnapshot } from '@/layers/snapshot';
import { useHistoryStore } from './historyStore';
import type { BaseLayer, Background, Layer, Project, Ratio, TextLayer } from '@/layers/types';

/**
 * 이동/확대/회전만 담은 부분 타입.
 * Layer는 유니온이라 Partial<Layer>로 패치하면 타입별 필드가 섞여 들어갈 수 있다.
 * 공통 변환만 다루는 경로를 따로 두면 그 사고를 타입 단계에서 막는다.
 */
export type LayerTransform = Pick<BaseLayer, 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation'>;

export type TextPatch = Partial<Omit<TextLayer, 'id' | 'type'>>;

const DEFAULT_BACKGROUND: Background = { type: 'solid', color: '#ffffff' };

interface ProjectState {
  project: Project | null;
  createProject: (ratio: Ratio) => void;
  closeProject: () => void;
  addLayers: (layers: readonly Layer[]) => void;
  updateLayerTransform: (id: string, patch: Partial<LayerTransform>) => void;
  /**
   * 슬라이더처럼 연속으로 값이 바뀌는 조작은 첫 변경만 기록한다.
   * 매 프레임 기록하면 한 번 드래그에 히스토리가 수십 단계 쌓여 실행취소가 쓸모없어진다.
   */
  setLayerOpacity: (id: string, opacity: number, record?: boolean) => void;
  toggleFlipX: (id: string) => void;
  updateTextLayer: (id: string, patch: TextPatch) => void;
  reorderLayer: (id: string, command: ReorderCommand) => void;
  /** 복제본을 바로 선택할 수 있도록 새 id를 돌려준다. */
  duplicateLayer: (id: string) => string | null;
  removeLayer: (id: string) => void;
  undo: () => void;
  redo: () => void;
  /** 새 레이어가 항상 맨 위로 오도록 다음 zIndex를 준다. */
  peekNextZIndex: () => number;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  /**
   * 모든 레이어 변경은 이 경로를 지난다.
   * 변경 직전 상태를 히스토리에 남기는 지점을 한 곳으로 모아야,
   * 액션을 추가할 때마다 기록을 빼먹는 실수가 생기지 않는다.
   */
  const applyLayers = (layers: readonly Layer[], record = true): void => {
    const project = get().project;
    if (!project) return;
    // 결과가 이전과 같으면 아무 일도 하지 않는다.
    // 맨 앞 레이어를 다시 맨 앞으로 보내는 것 같은 헛동작이 히스토리를 채우는 걸 막는다.
    if (isSameLayerList(project.layers, layers)) return;
    if (record) useHistoryStore.getState().record(takeSnapshot(project));
    set({ project: { ...project, layers: [...layers], updatedAt: Date.now() } });
  };

  return {
    project: null,

    createProject: (ratio) => {
      const now = Date.now();
      // 이전 작업의 히스토리가 남아 있으면 새 프로젝트에서 실행취소가 남의 상태를 불러온다
      useHistoryStore.getState().reset();
      set({
        project: {
          id: createId(),
          ratio,
          background: DEFAULT_BACKGROUND,
          layers: [],
          createdAt: now,
          updatedAt: now,
        },
      });
    },

    closeProject: () => {
      useHistoryStore.getState().reset();
      set({ project: null });
    },

    addLayers: (layers) => {
      const project = get().project;
      if (!project || layers.length === 0) return;
      applyLayers([...project.layers, ...layers]);
    },

    updateLayerTransform: (id, patch) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchBaseLayer(project.layers, id, patch));
    },

    setLayerOpacity: (id, opacity, record = true) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchBaseLayer(project.layers, id, { opacity }), record);
    },

    toggleFlipX: (id) => {
      const project = get().project;
      if (!project) return;
      const target = project.layers.find((layer) => layer.id === id);
      if (!target) return;
      applyLayers(patchBaseLayer(project.layers, id, { flipX: !target.flipX }));
    },

    updateTextLayer: (id, patch) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchTextLayer(project.layers, id, patch));
    },

    reorderLayer: (id, command) => {
      const project = get().project;
      if (!project) return;
      applyLayers(reorderLayers(project.layers, id, command));
    },

    duplicateLayer: (id) => {
      const project = get().project;
      if (!project) return null;
      const result = duplicateLayerById(project.layers, id);
      if (!result) return null;
      applyLayers(result.layers);
      return result.newId;
    },

    removeLayer: (id) => {
      const project = get().project;
      if (!project) return;
      applyLayers(removeLayerById(project.layers, id));
    },

    undo: () => {
      const project = get().project;
      if (!project) return;
      const restored = useHistoryStore.getState().undo(takeSnapshot(project));
      if (!restored) return;
      set({ project: applySnapshot(project, restored) });
    },

    redo: () => {
      const project = get().project;
      if (!project) return;
      const restored = useHistoryStore.getState().redo(takeSnapshot(project));
      if (!restored) return;
      set({ project: applySnapshot(project, restored) });
    },

    peekNextZIndex: () => {
      const project = get().project;
      return project ? nextZIndex(project.layers) : 0;
    },
  };
});

/** 캔버스 논리 크기. 프로젝트가 없으면 렌더할 것도 없으므로 null을 준다. */
export function useCanvasSize(): { width: number; height: number } | null {
  const ratio = useProjectStore((state) => state.project?.ratio);
  return ratio ? getRatioSize(ratio) : null;
}

/** 선택된 레이어. 컨텍스트 바와 텍스트 편집 모달이 함께 쓴다. */
export function useLayerById(id: string | null): Layer | null {
  return useProjectStore((state) => {
    if (!id || !state.project) return null;
    return state.project.layers.find((layer) => layer.id === id) ?? null;
  });
}
