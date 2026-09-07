import { useState } from 'react';
import DebugOverlay from '@/components/DebugOverlay';
import EditorScreen from '@/components/EditorScreen';
import HomeScreen from '@/components/HomeScreen';
import RatioScreen from '@/components/RatioScreen';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { Ratio } from '@/layers/types';

type Screen = 'home' | 'ratio';

/**
 * 화면이 셋뿐이고 딥링크도 필요 없어서 라우터를 두지 않는다.
 * 편집 중이면 프로젝트 존재 여부가 곧 화면 상태다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const project = useProjectStore((state) => state.project);
  const createProject = useProjectStore((state) => state.createProject);
  const closeProject = useProjectStore((state) => state.closeProject);
  const clearSelection = useSelectionStore((state) => state.clear);

  const handleSelectRatio = (ratio: Ratio) => {
    createProject(ratio);
    clearSelection();
  };

  const handleExitEditor = () => {
    closeProject();
    clearSelection();
    setScreen('home');
  };

  return (
    <>
      {project ? (
        <EditorScreen onExit={handleExitEditor} />
      ) : screen === 'ratio' ? (
        <RatioScreen onSelect={handleSelectRatio} onBack={() => setScreen('home')} />
      ) : (
        <HomeScreen onCreate={() => setScreen('ratio')} />
      )}
      {import.meta.env.DEV && <DebugOverlay />}
    </>
  );
}
