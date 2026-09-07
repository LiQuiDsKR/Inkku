import { useEffect, useState } from 'react';
import DebugOverlay from '@/components/DebugOverlay';
import EditorScreen from '@/components/EditorScreen';
import HomeScreen from '@/components/HomeScreen';
import RatioScreen from '@/components/RatioScreen';
import { loadLatestProject } from '@/storage/projectRepo';
import { finishEditing, startAutoSave } from '@/store/autoSave';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';
import { logDebug } from '@/utils/debugLog';
import type { Project, Ratio } from '@/layers/types';

type Screen = 'home' | 'ratio';

/**
 * 화면이 셋뿐이고 딥링크도 필요 없어서 라우터를 두지 않는다.
 * 편집 중이면 프로젝트 존재 여부가 곧 화면 상태다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [saved, setSaved] = useState<Project | null>(null);

  const project = useProjectStore((state) => state.project);
  const createProject = useProjectStore((state) => state.createProject);
  const openProject = useProjectStore((state) => state.openProject);
  const closeProject = useProjectStore((state) => state.closeProject);
  const clearSelection = useSelectionStore((state) => state.clear);
  const resetTools = useToolStore((state) => state.reset);

  // 자동 저장은 컴포넌트가 아니라 스토어 구독이다. 앱이 사는 동안 한 번만 건다.
  useEffect(() => startAutoSave(), []);

  useEffect(() => {
    let alive = true;
    loadLatestProject()
      .then((found) => {
        if (alive) setSaved(found);
      })
      .catch((error: unknown) => {
        logDebug(`저장된 작업물을 읽지 못했다: ${error instanceof Error ? error.message : String(error)}`);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSelectRatio = (ratio: Ratio) => {
    createProject(ratio);
    clearSelection();
    resetTools();
  };

  const handleResume = () => {
    if (!saved) return;
    openProject(saved);
    clearSelection();
    resetTools();
  };

  const handleExitEditor = () => {
    // 화면은 먼저 넘긴다. 저장과 이미지 정리가 끝날 때까지 사용자를 붙잡아 둘 이유가 없다.
    const closing = useProjectStore.getState().project;
    closeProject();
    clearSelection();
    resetTools();
    setScreen('home');
    setSaved(closing);

    void finishEditing(closing);
  };

  return (
    <>
      {project ? (
        <EditorScreen onExit={handleExitEditor} />
      ) : screen === 'ratio' ? (
        <RatioScreen onSelect={handleSelectRatio} onBack={() => setScreen('home')} />
      ) : (
        <HomeScreen
          onCreate={() => setScreen('ratio')}
          onResume={handleResume}
          savedLayerCount={saved?.layers.length ?? null}
        />
      )}
      {import.meta.env.DEV && <DebugOverlay />}
    </>
  );
}
