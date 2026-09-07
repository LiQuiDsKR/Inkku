import { useCallback } from 'react';
import EditorStage from '@/canvas/EditorStage';
import BackgroundPanel from './BackgroundPanel';
import DrawPanel from './DrawPanel';
import EditorToolbar from './EditorToolbar';
import EditorTopBar from './EditorTopBar';
import LayerContextBar from './LayerContextBar';
import ShapePanel from './ShapePanel';
import StickerPanel from './StickerPanel';
import TextEditorModal from './TextEditorModal';
import { commitStroke } from '@/layers/importDrawing';
import { useLayerById, useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore, type BrushSettings } from '@/store/toolStore';
import { logDebug } from '@/utils/debugLog';
import type { Point } from '@/canvas/gestureMath';
import type { Layer } from '@/layers/types';

interface EditorScreenProps {
  onExit: () => void;
}

export default function EditorScreen({ onExit }: EditorScreenProps) {
  const project = useProjectStore((state) => state.project);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedLayer = useLayerById(selectedId);

  const panel = useToolStore((state) => state.panel);
  const closePanel = useToolStore((state) => state.closePanel);
  const brush = useToolStore((state) => state.brush);
  const textEditor = useToolStore((state) => state.textEditor);
  const openTextEditor = useToolStore((state) => state.openTextEditor);
  const closeTextEditor = useToolStore((state) => state.closeTextEditor);

  /**
   * 획을 굳혀 레이어로 만든다.
   * 굽기와 저장은 비동기라 그리는 손과 분리되어 있다. 굳는 동안에도 다음 획을 그을 수 있다.
   */
  const handleStrokeEnd = useCallback(
    (points: readonly Point[], settings: BrushSettings) => {
      void commitStroke({
        points,
        color: settings.color,
        strokeWidth: settings.width,
        zIndex: peekNextZIndex(),
      })
        .then((layer) => {
          if (layer) addLayers([layer]);
        })
        .catch((error: unknown) => {
          logDebug(error instanceof Error ? error.message : String(error));
        });
    },
    [addLayers, peekNextZIndex],
  );

  if (!project) return null;

  /** 더블탭 편집. 지금은 글자만 다시 열 수 있고, 사진 자르기는 나중이다. */
  const handleRequestEdit = (layer: Layer) => {
    if (layer.type === 'text') openTextEditor({ mode: 'edit', layerId: layer.id });
  };

  const drawing = panel === 'draw';

  return (
    <div className="flex h-full flex-col">
      <EditorTopBar onBack={onExit} />
      <EditorStage
        project={project}
        onRequestEdit={handleRequestEdit}
        brush={drawing ? brush : null}
        onStrokeEnd={handleStrokeEnd}
      />

      {/* 패널이 열려 있으면 컨텍스트 바를 숨긴다. 둘을 함께 띄우면 폰에서 캔버스가 거의 안 보인다 */}
      {selectedLayer && !panel && <LayerContextBar layer={selectedLayer} />}
      {panel === 'sticker' && <StickerPanel onClose={closePanel} />}
      {panel === 'shape' && <ShapePanel onClose={closePanel} />}
      {panel === 'draw' && <DrawPanel onClose={closePanel} />}
      {panel === 'background' && <BackgroundPanel onClose={closePanel} />}

      <EditorToolbar />

      {textEditor && <TextEditorModal target={textEditor} onClose={closeTextEditor} />}
    </div>
  );
}
