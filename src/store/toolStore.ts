import { create } from 'zustand';

/** 하단 툴바가 여는 패널. 한 번에 하나만 열린다. */
export type PanelKind = 'sticker' | 'draw' | 'shape' | 'background';

/**
 * 텍스트 편집은 패널이 아니라 전체 모달이다.
 * 새로 만드는 중인지 기존 레이어를 고치는 중인지 구분해야
 * 취소했을 때 빈 레이어를 남길지 원래대로 되돌릴지 결정할 수 있다.
 */
export type TextEditorTarget = { mode: 'create' } | { mode: 'edit'; layerId: string };

export interface BrushSettings {
  color: string;
  /** 논리 좌표 기준 두께. 캔버스 긴 변이 1080이므로 14면 볼펜, 60이면 형광펜에 가깝다. */
  width: number;
}

const DEFAULT_BRUSH: BrushSettings = { color: '#ff5470', width: 14 };

interface ToolState {
  panel: PanelKind | null;
  textEditor: TextEditorTarget | null;
  brush: BrushSettings;
  setBrush: (patch: Partial<BrushSettings>) => void;
  togglePanel: (panel: PanelKind) => void;
  closePanel: () => void;
  openTextEditor: (target: TextEditorTarget) => void;
  closeTextEditor: () => void;
  /** 편집을 끝내고 나갈 때. 다음에 들어왔을 때 지난번 패널이 열려 있으면 당황스럽다. */
  reset: () => void;
}

/**
 * 열려 있는 패널은 프로젝트 데이터가 아니라 화면 상태다.
 * 프로젝트 스토어에 섞으면 히스토리 스냅샷에 들어가서
 * 실행취소가 "패널을 다시 여는" 무의미한 단계를 만든다.
 */
export const useToolStore = create<ToolState>((set) => ({
  panel: null,
  textEditor: null,
  // 붓 설정은 프로젝트가 아니라 도구의 상태다. 실행취소로 되돌아가면 오히려 당황스럽다.
  brush: DEFAULT_BRUSH,

  setBrush: (patch) => set((state) => ({ brush: { ...state.brush, ...patch } })),

  // 같은 버튼을 다시 누르면 닫힌다. 폰에서는 닫기 버튼을 따로 찾는 것보다 이쪽이 빠르다.
  togglePanel: (panel) => set((state) => ({ panel: state.panel === panel ? null : panel })),

  closePanel: () => set({ panel: null }),

  // 모달이 뜨는 동안 패널이 뒤에 남아 있으면 화면이 두 겹으로 덮인다
  openTextEditor: (target) => set({ textEditor: target, panel: null }),

  closeTextEditor: () => set({ textEditor: null }),

  reset: () => set({ panel: null, textEditor: null }),
}));
