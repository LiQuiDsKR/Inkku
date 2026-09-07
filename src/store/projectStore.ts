import { create } from 'zustand';
import { createId } from '@/utils/id';
import { getRatioSize } from '@/layers/ratio';
import type { BaseLayer, Background, Layer, Project, Ratio } from '@/layers/types';

/**
 * 이동/확대/회전만 담은 부분 타입.
 * Layer는 유니온이라 Partial<Layer>로 패치하면 타입별 필드가 섞여 들어갈 수 있다.
 * 공통 변환만 다루는 경로를 따로 두면 그 사고를 타입 단계에서 막는다.
 */
export type LayerTransform = Pick<BaseLayer, 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation'>;

const DEFAULT_BACKGROUND: Background = { type: 'solid', color: '#ffffff' };

interface ProjectState {
  project: Project | null;
  createProject: (ratio: Ratio) => void;
  closeProject: () => void;
  addLayers: (layers: readonly Layer[]) => void;
  updateLayerTransform: (id: string, patch: Partial<LayerTransform>) => void;
  removeLayer: (id: string) => void;
  /** 새 레이어가 항상 맨 위로 오도록 다음 zIndex를 준다. */
  peekNextZIndex: () => number;
}

function touch(project: Project, layers: Layer[]): Project {
  return { ...project, layers, updatedAt: Date.now() };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,

  createProject: (ratio) => {
    const now = Date.now();
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

  closeProject: () => set({ project: null }),

  addLayers: (layers) =>
    set((state) => {
      if (!state.project || layers.length === 0) return state;
      return { project: touch(state.project, [...state.project.layers, ...layers]) };
    }),

  updateLayerTransform: (id, patch) =>
    set((state) => {
      if (!state.project) return state;
      const layers = state.project.layers.map((layer) =>
        layer.id === id ? { ...layer, ...patch } : layer,
      );
      return { project: touch(state.project, layers) };
    }),

  removeLayer: (id) =>
    set((state) => {
      if (!state.project) return state;
      const layers = state.project.layers.filter((layer) => layer.id !== id);
      return { project: touch(state.project, layers) };
    }),

  peekNextZIndex: () => {
    const project = get().project;
    if (!project || project.layers.length === 0) return 0;
    return Math.max(...project.layers.map((layer) => layer.zIndex)) + 1;
  },
}));

/** 캔버스 논리 크기. 프로젝트가 없으면 렌더할 것도 없으므로 null을 준다. */
export function useCanvasSize(): { width: number; height: number } | null {
  const ratio = useProjectStore((state) => state.project?.ratio);
  return ratio ? getRatioSize(ratio) : null;
}
