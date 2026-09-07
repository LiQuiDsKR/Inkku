import EditorStage from '@/canvas/EditorStage';
import EditorToolbar from './EditorToolbar';
import EditorTopBar from './EditorTopBar';
import LayerContextBar from './LayerContextBar';
import StickerPanel from './StickerPanel';
import TextEditorModal from './TextEditorModal';
import { useLayerById, useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';
import type { Layer } from '@/layers/types';

interface EditorScreenProps {
  onExit: () => void;
}

export default function EditorScreen({ onExit }: EditorScreenProps) {
  const project = useProjectStore((state) => state.project);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedLayer = useLayerById(selectedId);

  const panel = useToolStore((state) => state.panel);
  const closePanel = useToolStore((state) => state.closePanel);
  const textEditor = useToolStore((state) => state.textEditor);
  const openTextEditor = useToolStore((state) => state.openTextEditor);
  const closeTextEditor = useToolStore((state) => state.closeTextEditor);

  if (!project) return null;

  /** 더블탭 편집. 지금은 글자만 다시 열 수 있고, 사진 자르기는 Phase 3이다. */
  const handleRequestEdit = (layer: Layer) => {
    if (layer.type === 'text') openTextEditor({ mode: 'edit', layerId: layer.id });
  };

  return (
    <div className="flex h-full flex-col">
      <EditorTopBar onBack={onExit} />
      <EditorStage project={project} onRequestEdit={handleRequestEdit} />

      {/* 패널이 열려 있으면 컨텍스트 바를 숨긴다. 둘을 함께 띄우면 폰에서 캔버스가 거의 안 보인다 */}
      {selectedLayer && !panel && <LayerContextBar layer={selectedLayer} />}
      {panel === 'sticker' && <StickerPanel onClose={closePanel} />}

      <EditorToolbar />

      {textEditor && <TextEditorModal target={textEditor} onClose={closeTextEditor} />}
    </div>
  );
}
