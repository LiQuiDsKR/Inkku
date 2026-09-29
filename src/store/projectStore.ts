import { create } from 'zustand';
import { createId } from '@/utils/id';
import { getRatioSize } from '@/layers/ratio';
import {
  duplicateLayerById,
  patchBaseLayer,
  patchParticleLayer,
  patchPhotoLayer,
  patchShapeLayer,
  patchTextLayer,
  removeLayerById,
} from '@/layers/mutations';
import { nextZIndex, reorderLayers, type ReorderCommand } from '@/layers/order';
import { extractLegacyTemplate } from '@/layers/projectTemplate';
import { applySnapshot, isSameLayerList, takeSnapshot } from '@/layers/snapshot';
import { useHistoryStore } from './historyStore';
import type {
  BaseLayer,
  Background,
  Layer,
  ParticleLayer,
  PhotoLayer,
  Project,
  ProjectTemplate,
  Ratio,
  ShapeLayer,
  TextLayer,
} from '@/layers/types';

/**
 * 이동/확대/회전만 담은 부분 타입.
 * Layer는 유니온이라 Partial<Layer>로 패치하면 타입별 필드가 섞여 들어갈 수 있다.
 * 공통 변환만 다루는 경로를 따로 두면 그 사고를 타입 단계에서 막는다.
 */
export type LayerTransform = Pick<BaseLayer, 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation'>;

export type TextPatch = Partial<Omit<TextLayer, 'id' | 'type'>>;
export type ShapePatch = Partial<Omit<ShapeLayer, 'id' | 'type'>>;
export type PhotoPatch = Partial<Omit<PhotoLayer, 'id' | 'type'>>;
export type ParticlePatch = Partial<Omit<ParticleLayer, 'id' | 'type'>>;
export type TemplatePatch = Partial<Omit<ProjectTemplate, 'templateId'>>;

const DEFAULT_BACKGROUND: Background = { type: 'solid', color: '#ffffff' };

interface ProjectState {
  project: Project | null;
  createProject: (ratio: Ratio) => void;
  /** 저장해 둔 작업물을 이어서 연다. */
  openProject: (project: Project) => void;
  closeProject: () => void;
  addLayers: (layers: readonly Layer[]) => void;
  setBackground: (background: Background) => void;
  /** 카드를 깔거나(스펙 교체) 걷어 낸다(null). 배경을 바꾸는 것과 같은 층위의 조작이다. */
  setTemplate: (template: ProjectTemplate | null) => void;
  /**
   * 깔아 둔 카드의 변형, 글, 사진 슬롯.
   * 글자 입력은 한 글자마다 들어오므로 투명도 슬라이더와 같은 이유로 기록을 끌 수 있어야 한다.
   */
  updateTemplate: (patch: TemplatePatch, record?: boolean) => void;
  updateLayerTransform: (id: string, patch: Partial<LayerTransform>) => void;
  /**
   * 슬라이더처럼 연속으로 값이 바뀌는 조작은 첫 변경만 기록한다.
   * 매 프레임 기록하면 한 번 드래그에 히스토리가 수십 단계 쌓여 실행취소가 쓸모없어진다.
   */
  setLayerOpacity: (id: string, opacity: number, record?: boolean) => void;
  updateTextLayer: (id: string, patch: TextPatch) => void;
  updateShapeLayer: (id: string, patch: ShapePatch) => void;
  updateParticleLayer: (id: string, patch: ParticlePatch) => void;
  /** 자르기 슬라이더처럼 연속으로 바뀌는 값은 첫 변경만 기록한다. */
  updatePhotoLayer: (id: string, patch: PhotoPatch, record?: boolean) => void;
  /** 선택으로 인한 자동 올리기는 히스토리에 남기지 않는다. 그때만 record를 끈다. */
  reorderLayer: (id: string, command: ReorderCommand, record?: boolean) => void;
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
          template: null,
          layers: [],
          createdAt: now,
          updatedAt: now,
        },
      });
    },

    openProject: (project) => {
      // 저장된 작업물에는 히스토리가 없다. 이전 작업의 기록이 남아 있으면 남의 상태로 되돌아간다.
      useHistoryStore.getState().reset();

      // 카드를 레이어로 저장하던 시절의 작업물을 지금 구조로 옮긴다
      const migrated = extractLegacyTemplate(project.layers);
      set({
        project: {
          ...project,
          template: project.template ?? migrated.template,
          layers: migrated.layers,
        },
      });
    },

    closeProject: () => {
      useHistoryStore.getState().reset();
      set({ project: null });
    },

    setBackground: (background) => {
      const project = get().project;
      if (!project) return;
      useHistoryStore.getState().record(takeSnapshot(project));
      set({ project: { ...project, background, updatedAt: Date.now() } });
    },

    setTemplate: (template) => {
      const project = get().project;
      if (!project) return;
      useHistoryStore.getState().record(takeSnapshot(project));
      set({ project: { ...project, template, updatedAt: Date.now() } });
    },

    updateTemplate: (patch, record = true) => {
      const project = get().project;
      if (!project?.template) return;
      if (record) useHistoryStore.getState().record(takeSnapshot(project));
      set({
        project: {
          ...project,
          template: { ...project.template, ...patch },
          updatedAt: Date.now(),
        },
      });
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

    updateTextLayer: (id, patch) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchTextLayer(project.layers, id, patch));
    },

    updateShapeLayer: (id, patch) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchShapeLayer(project.layers, id, patch));
    },

    updateParticleLayer: (id, patch) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchParticleLayer(project.layers, id, patch));
    },

    updatePhotoLayer: (id, patch, record = true) => {
      const project = get().project;
      if (!project) return;
      applyLayers(patchPhotoLayer(project.layers, id, patch), record);
    },

    reorderLayer: (id, command, record = true) => {
      const project = get().project;
      if (!project) return;
      applyLayers(reorderLayers(project.layers, id, command), record);
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
