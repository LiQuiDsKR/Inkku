import { useCallback, useState } from 'react';
import type Konva from 'konva';
import EditorStage from '@/canvas/EditorStage';
import BackgroundPanel from './BackgroundPanel';
import DrawPanel from './DrawPanel';
import EditorToolbar from './EditorToolbar';
import EditorTopBar from './EditorTopBar';
import LayerContextBar from './LayerContextBar';
import LayerPanel from './LayerPanel';
import PhotoPanel from './PhotoPanel';
import ShapePanel from './ShapePanel';
import StickerPanel from './StickerPanel';
import TextEditorModal from './TextEditorModal';
import { useExport } from '@/export/useExport';
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
  const [stage, setStage] = useState<Konva.Stage | null>(null);
  const project = useProjectStore((state) => state.project);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedLayer = useLayerById(selectedId);

  const panel = useToolStore((state) => state.panel);
  const closePanel = useToolStore((state) => state.closePanel);
  const openPanel = useToolStore((state) => state.openPanel);
  const brush = useToolStore((state) => state.brush);
  const textEditor = useToolStore((state) => state.textEditor);
  const openTextEditor = useToolStore((state) => state.openTextEditor);
  const closeTextEditor = useToolStore((state) => state.closeTextEditor);

  const exporter = useExport(stage, project?.ratio);

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

  /** 더블탭 편집. 글자는 입력 모달, 사진은 보정 패널을 연다. */
  const handleRequestEdit = (layer: Layer) => {
    if (layer.type === 'text') openTextEditor({ mode: 'edit', layerId: layer.id });
    else if (layer.type === 'photo') openPanel('photo');
  };

  const drawing = panel === 'draw';

  return (
    <div className="flex h-full flex-col">
      <EditorTopBar onBack={onExit} onExport={exporter.run} exporting={exporter.busy} />
      <EditorStage
        project={project}
        onRequestEdit={handleRequestEdit}
        brush={drawing ? brush : null}
        onStrokeEnd={handleStrokeEnd}
        onStageReady={setStage}
      />

      {/* 패널은 흐름에 둬서 캔버스를 줄인다. 고르는 동안 캔버스가 작아지는 건 자연스럽다 */}
      {panel === 'sticker' && <StickerPanel onClose={closePanel} />}
      {panel === 'shape' && <ShapePanel onClose={closePanel} />}
      {panel === 'draw' && <DrawPanel onClose={closePanel} />}
      {panel === 'background' && <BackgroundPanel onClose={closePanel} />}
      {panel === 'photo' && <PhotoPanel onClose={closePanel} />}
      {panel === 'layers' && <LayerPanel onClose={closePanel} />}

      {/*
        컨텍스트 바는 툴바 위에 떠 있는다(absolute).
        패널이 열려 있으면 숨긴다. 둘을 함께 띄우면 폰에서 캔버스가 거의 안 보인다.
      */}
      <div className="relative shrink-0">
        {selectedLayer && !panel && <LayerContextBar layer={selectedLayer} />}
        <EditorToolbar />
      </div>

      {textEditor && <TextEditorModal target={textEditor} onClose={closeTextEditor} />}

      {/* 내보내기 상태. 공유 시트가 뜨기까지 몇 초 걸려서 아무 반응이 없으면 다시 누르게 된다 */}
      {exporter.status && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center">
          <span className="rounded-full bg-black/85 px-4 py-2 text-sm">{exporter.status}</span>
        </div>
      )}
    </div>
  );
}
