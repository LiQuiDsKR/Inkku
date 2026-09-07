import EditorStage from '@/canvas/EditorStage';
import EditorToolbar from './EditorToolbar';
import EditorTopBar from './EditorTopBar';
import { useProjectStore } from '@/store/projectStore';

interface EditorScreenProps {
  onExit: () => void;
}

export default function EditorScreen({ onExit }: EditorScreenProps) {
  const project = useProjectStore((state) => state.project);
  if (!project) return null;

  return (
    <div className="flex h-full flex-col">
      <EditorTopBar onBack={onExit} />
      <EditorStage project={project} />
      <EditorToolbar />
    </div>
  );
}
