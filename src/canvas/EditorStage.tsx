import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer as KonvaLayer, Line, Stage } from 'react-konva';
import type Konva from 'konva';
import BackgroundContent, { BACKGROUND_NAME } from './BackgroundContent';
import LayerNode from './LayerNode';
import SelectionTransformer from './SelectionTransformer';
import { useStageSize } from './useStageSize';
import { useBrushDrawing } from './useBrushDrawing';
import { useTwoFingerGesture } from './useTwoFingerGesture';
import { useWheelGesture } from './useWheelGesture';
import type { NodeTransform, Point } from './gestureMath';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { BrushSettings } from '@/store/toolStore';
import type { Layer, Project } from '@/layers/types';

interface EditorStageProps {
  project: Project;
  /** 더블탭으로 편집을 요청한 레이어. 어떤 편집 화면을 띄울지는 UI 쪽이 정한다. */
  onRequestEdit: (layer: Layer) => void;
  /** 그리기 도구가 켜져 있으면 붓 설정이 온다. null이면 평소의 선택/이동 모드다. */
  brush: BrushSettings | null;
  onStrokeEnd: (points: readonly Point[], brush: BrushSettings) => void;
}

export default function EditorStage({
  project,
  onRequestEdit,
  brush,
  onStrokeEnd,
}: EditorStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(new Map<string, Konva.Group>());

  // 스테이지와 Transformer는 크기 측정이 끝난 뒤에 마운트된다.
  // ref로 들고 있으면 최초 effect에서 아직 null이라 리스너가 영영 안 붙는다.
  const [stage, setStage] = useState<Konva.Stage | null>(null);
  const [konvaLayer, setKonvaLayer] = useState<Konva.Layer | null>(null);
  const [transformer, setTransformer] = useState<Konva.Transformer | null>(null);
  const [previewLine, setPreviewLine] = useState<Konva.Line | null>(null);

  const updateLayerTransform = useProjectStore((state) => state.updateLayerTransform);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);

  const size = useStageSize(containerRef, project.ratio);

  const layers = useMemo(
    () => [...project.layers].sort((a, b) => a.zIndex - b.zIndex),
    [project.layers],
  );

  const registerNode = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodesRef.current.set(id, node);
    else nodesRef.current.delete(id);
  }, []);

  /**
   * 사진은 IndexedDB에서 늦게 온다. 도착 시점에 두 가지를 다시 맞춰야 한다.
   *
   * 1. Transformer: 도착 전에는 크기 0인 그룹을 잡고 있어 핸들이 한 점에 뭉친다.
   * 2. 히트 그래프: 씬은 다시 그려지지만 히트 캔버스가 갱신되지 않아,
   *    사진이 보이는데도 클릭이 뒤 배경으로 떨어진다. 배경 클릭은 선택 해제라 포커스가 풀린다.
   */
  const handleContentReady = useCallback(() => {
    konvaLayer?.drawHit();
    transformer?.forceUpdate();
    konvaLayer?.batchDraw();
  }, [konvaLayer, transformer]);

  // 선택된 노드에 Transformer를 붙인다.
  // 레이어 목록이 바뀌면 노드 인스턴스가 새로 생기므로 다시 찾아야 한다.
  // 그리는 중에는 붙이지 않는다. 획을 긋는 손이 핸들에 걸리면 그리기가 끊긴다.
  useEffect(() => {
    if (!transformer) return;
    const node = selectedId && !brush ? nodesRef.current.get(selectedId) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [transformer, selectedId, layers, brush]);

  const getTargetNode = useCallback(
    () => (selectedId ? (nodesRef.current.get(selectedId) ?? null) : null),
    [selectedId],
  );

  const commitSelected = useCallback(
    (transform: NodeTransform) => {
      if (selectedId) updateLayerTransform(selectedId, transform);
    },
    [selectedId, updateLayerTransform],
  );

  const refreshTransformer = useCallback(() => transformer?.forceUpdate(), [transformer]);

  useTwoFingerGesture({
    stage,
    getTargetNode,
    onUpdate: refreshTransformer,
    onCommit: commitSelected,
  });

  // PC에서는 두 손가락이 없다. 휠로 같은 동작을 할 수 있어야 개발 중 반복 확인이 빠르다.
  useWheelGesture({
    stage,
    getTargetNode,
    onUpdate: refreshTransformer,
    onCommit: commitSelected,
  });

  useBrushDrawing({
    stage,
    previewLine,
    enabled: brush !== null,
    onStrokeEnd: (points) => {
      if (brush) onStrokeEnd(points, brush);
    },
  });

  const handleStagePointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
    // 그리는 중에 배경을 눌렀다고 선택을 건드릴 필요가 없다
    if (brush) return;
    // 레이어를 눌렀으면 그 레이어가 스스로 선택된다. 배경이나 빈 곳일 때만 해제한다.
    const target = event.target;
    if (target === target.getStage() || target.name() === BACKGROUND_NAME) {
      select(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-surface flex min-h-0 flex-1 items-center justify-center overflow-hidden"
    >
      {size && (
        <Stage
          ref={setStage}
          width={size.width}
          height={size.height}
          scaleX={size.scale}
          scaleY={size.scale}
          onPointerDown={handleStagePointerDown}
        >
          {/* 그리는 동안에는 레이어가 이벤트를 받지 않아야 획이 레이어 선택으로 새지 않는다 */}
          <KonvaLayer ref={setKonvaLayer} listening={brush === null}>
            <BackgroundContent
              background={project.background}
              width={size.logicalWidth}
              height={size.logicalHeight}
            />
            {layers.map((layer) => (
              <LayerNode
                key={layer.id}
                layer={layer}
                onSelect={select}
                onTransformCommit={updateLayerTransform}
                registerNode={registerNode}
                onContentReady={handleContentReady}
                onRequestEdit={onRequestEdit}
              />
            ))}
            <SelectionTransformer onRef={setTransformer} />
          </KonvaLayer>

          {/*
            미리보기 획은 별도 레이어에 둔다.
            같은 레이어에 두면 점이 늘어날 때마다 사진과 스티커까지 전부 다시 그려진다.
          */}
          {brush && (
            <KonvaLayer listening={false}>
              <Line
                ref={setPreviewLine}
                stroke={brush.color}
                strokeWidth={brush.width}
                lineCap="round"
                lineJoin="round"
              />
            </KonvaLayer>
          )}
        </Stage>
      )}
    </div>
  );
}
