import { create } from 'zustand';
import { logDebug } from '@/utils/debugLog';

/**
 * 앱 설정.
 *
 * 작업물이 아니라 사람의 취향이라 프로젝트에 넣지 않는다.
 * 저장은 localStorage에 한다. 사진은 용량 제한 때문에 반드시 IndexedDB지만,
 * 켜고 끄기 값 몇 개는 몇 바이트고 앱이 뜨자마자 동기로 읽을 수 있어야 한다.
 */

const STORAGE_KEY = 'inkku.settings';

/** 캔버스에 겹쳐 보는 보조선. 버튼 하나로 이 순서대로 돈다. */
export const GRID_KINDS = ['none', '2x2', '3x3', '4x4'] as const;

export type GridKind = (typeof GRID_KINDS)[number];

export interface Settings {
  /** 고른 요소를 자동으로 맨 위로 올린다. */
  autoFront: boolean;
  grid: GridKind;
}

const DEFAULT_SETTINGS: Settings = {
  // 기본은 끔. 애써 맞춰 둔 순서가 손댈 때마다 바뀌면 놀라는 사람이 더 많다.
  autoFront: false,
  grid: 'none',
};

function isGridKind(value: unknown): value is GridKind {
  return GRID_KINDS.some((kind) => kind === value);
}

function readSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;

    const record = parsed as Record<string, unknown>;
    return {
      autoFront:
        typeof record.autoFront === 'boolean' ? record.autoFront : DEFAULT_SETTINGS.autoFront,
      grid: isGridKind(record.grid) ? record.grid : DEFAULT_SETTINGS.grid,
    };
  } catch (error: unknown) {
    // 사파리 시크릿 모드는 저장소 접근 자체가 터진다. 설정 하나 때문에 앱이 죽으면 안 된다.
    logDebug(`설정을 읽지 못했다: ${error instanceof Error ? error.message : String(error)}`);
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error: unknown) {
    logDebug(`설정을 저장하지 못했다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface SettingsState extends Settings {
  setAutoFront: (value: boolean) => void;
  /** 보조선은 버튼 하나로 다음 것으로 넘긴다. 종류가 넷뿐이라 고르는 화면을 따로 둘 이유가 없다. */
  cycleGrid: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const persist = () => {
    const { autoFront, grid } = get();
    writeSettings({ autoFront, grid });
  };

  return {
    ...readSettings(),

    setAutoFront: (value) => {
      set({ autoFront: value });
      persist();
    },

    cycleGrid: () => {
      const index = GRID_KINDS.indexOf(get().grid);
      set({ grid: GRID_KINDS[(index + 1) % GRID_KINDS.length] ?? 'none' });
      persist();
    },
  };
});
