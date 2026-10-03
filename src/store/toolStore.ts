import { create } from 'zustand';

/**
 * 하단 툴바가 여는 패널. 한 번에 하나만 열린다.
 * element는 스티커, 꾸밈선, 도형을 한데 모은 패널이다(툴바 칸이 여섯 개뿐이라 합쳤다).
 */
export type PanelKind = 'element' | 'draw' | 'template' | 'background' | 'photo' | 'layers';

/**
 * 텍스트 편집은 패널이 아니라 전체 모달이다.
 * 새로 만드는 중인지 기존 레이어를 고치는 중인지 구분해야
 * 취소했을 때 빈 레이어를 남길지 원래대로 되돌릴지 결정할 수 있다.
 */
export type TextEditorTarget = { mode: 'create' } | { mode: 'edit'; layerId: string };

/**
 * 문구 스티커 편집 화면. 새로 만들 때는 어느 프리셋에서 시작하는지를 들고 간다.
 * 글자 편집과 따로 두는 이유는 화면 자체가 다르기 때문이다(프리셋, 도형, 색 탭이 있다).
 */
export type StickerEditorTarget =
  | { mode: 'create'; presetId: string }
  | { mode: 'edit'; layerId: string };

export interface BrushSettings {
  color: string;
  /** 논리 좌표 기준 두께. 캔버스 긴 변이 1080이므로 14면 볼펜, 60이면 형광펜에 가깝다. */
  width: number;
}

const DEFAULT_BRUSH: BrushSettings = { color: '#ff5470', width: 14 };

interface ToolState {
  panel: PanelKind | null;
  textEditor: TextEditorTarget | null;
  stickerEditor: StickerEditorTarget | null;
  brush: BrushSettings;
  /**
   * 결과물을 굽는 중인지.
   * 캔버스에는 편집용 표시가 섞여 있다(템플릿의 빈 사진 자리에 뜨는 더하기 표시).
   * 굽기 직전에 켜서 그런 표시를 숨긴다. 선택 해제와 같은 이유다.
   */
  exporting: boolean;
  setExporting: (exporting: boolean) => void;
  /**
   * 도형 안에서 사진을 맞추는 중인 레이어 id.
   * 이 동안에는 요소를 옮기거나 고르지 못한다. 같은 손가락 동작이 두 가지 뜻을 가질 수 없다.
   */
  maskEdit: string | null;
  openMaskEdit: (layerId: string) => void;
  closeMaskEdit: () => void;
  setBrush: (patch: Partial<BrushSettings>) => void;
  togglePanel: (panel: PanelKind) => void;
  /** 토글이 아니라 무조건 연다. 더블탭 같은 "이걸 열어라" 동작에 쓴다. */
  openPanel: (panel: PanelKind) => void;
  closePanel: () => void;
  openTextEditor: (target: TextEditorTarget) => void;
  closeTextEditor: () => void;
  openStickerEditor: (target: StickerEditorTarget) => void;
  closeStickerEditor: () => void;
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
  stickerEditor: null,
  // 붓 설정은 프로젝트가 아니라 도구의 상태다. 실행취소로 되돌아가면 오히려 당황스럽다.
  brush: DEFAULT_BRUSH,
  exporting: false,
  maskEdit: null,

  setExporting: (exporting) => set({ exporting }),

  // 맞추는 동안 패널이 열려 있으면 캔버스가 반만 보인다
  openMaskEdit: (layerId) => set({ maskEdit: layerId, panel: null }),

  closeMaskEdit: () => set({ maskEdit: null }),

  setBrush: (patch) => set((state) => ({ brush: { ...state.brush, ...patch } })),

  // 같은 버튼을 다시 누르면 닫힌다. 폰에서는 닫기 버튼을 따로 찾는 것보다 이쪽이 빠르다.
  togglePanel: (panel) => set((state) => ({ panel: state.panel === panel ? null : panel })),

  openPanel: (panel) => set({ panel }),

  closePanel: () => set({ panel: null }),

  // 모달이 뜨는 동안 패널이 뒤에 남아 있으면 화면이 두 겹으로 덮인다
  openTextEditor: (target) => set({ textEditor: target, panel: null }),

  closeTextEditor: () => set({ textEditor: null }),

  // 글자 모달과 같은 이유로 패널을 닫는다. 다 만들면 붙인 스티커를 바로 옮길 수 있어야 한다.
  openStickerEditor: (target) => set({ stickerEditor: target, panel: null }),

  closeStickerEditor: () => set({ stickerEditor: null }),

  reset: () =>
    set({ panel: null, textEditor: null, stickerEditor: null, exporting: false, maskEdit: null }),
}));
