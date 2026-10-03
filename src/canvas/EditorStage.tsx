import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer as KonvaLayer, Line, Stage } from 'react-konva';
import type Konva from 'konva';
import BackgroundContent, { BACKGROUND_NAME } from './BackgroundContent';
import LayerNode from './LayerNode';
import TemplateContent from './TemplateContent';
import SelectionTransformer from './SelectionTransformer';
import GridOverlay from './GridOverlay';
import { useStageSize } from './useStageSize';
import { useBrushDrawing } from './useBrushDrawing';
import { useDragSnap } from './useDragSnap';
import { useLongPress } from './useLongPress';
import { useMaskGesture, type MaskAdjust } from './useMaskGesture';
import { usePixelPicking } from './usePixelPicking';
import { useTwoFingerGesture } from './useTwoFingerGesture';
import { useWheelGesture } from './useWheelGesture';
import { formatAngle } from './snapping';
import type { NodeTransform, Point } from './gestureMath';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToolStore, type BrushSettings } from '@/store/toolStore';
import type { Layer, PhotoLayer, Project } from '@/layers/types';

/**
 * 이미 파괴된 Konva 노드인지 본다.
 *
 * StrictMode는 마운트를 한 번 되감았다가 다시 한다. 그때 앞선 마운트에서 만든 스테이지가 파괴되는데,
 * 그 노드를 가리키던 상태는 새 ref가 들어오기 전까지 잠깐 남아 있다.
 * 그 틈에 비동기로 도착한 이미지가 콜백을 부르면 파괴된 Transformer의 앵커를 건드려 터진다.
 * (이어서 편집으로 들어올 때 실제로 났던 오류다)
 */
function isLive(node: Konva.Node | null): boolean {
  return Boolean(node?.getStage());
}

interface EditorStageProps {
  project: Project;
  /** 더블탭으로 편집을 요청한 레이어. 어떤 편집 화면을 띄울지는 UI 쪽이 정한다. */
  onRequestEdit: (layer: Layer) => void;
  /** 템플릿의 사진 자리를 눌렀다. 파일 고르기는 UI 쪽 일이다. */
  onRequestSlot: (slotId: string) => void;
  /** 그리기 도구가 켜져 있으면 붓 설정이 온다. null이면 평소의 선택/이동 모드다. */
  brush: BrushSettings | null;
  onStrokeEnd: (points: readonly Point[], brush: BrushSettings) => void;
  /** 내보내기가 스테이지를 직접 다시 그려야 해서 위로 넘긴다. */
  onStageReady: (stage: Konva.Stage | null) => void;
}

export default function EditorStage({
  project,
  onRequestEdit,
  onRequestSlot,
  brush,
  onStrokeEnd,
  onStageReady,
}: EditorStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(new Map<string, Konva.Group>());

  // 스테이지와 Transformer는 크기 측정이 끝난 뒤에 마운트된다.
  // ref로 들고 있으면 최초 effect에서 아직 null이라 리스너가 영영 안 붙는다.
  const [stage, setStage] = useState<Konva.Stage | null>(null);
  const [konvaLayer, setKonvaLayer] = useState<Konva.Layer | null>(null);
  const [transformer, setTransformer] = useState<Konva.Transformer | null>(null);
  const [previewLine, setPreviewLine] = useState<Konva.Line | null>(null);
  /** 돌리는 중에만 뜨는 각도. null이면 아무것도 그리지 않는다. */
  const [angle, setAngle] = useState<number | null>(null);

  const updateLayerTransform = useProjectStore((state) => state.updateLayerTransform);
  const updatePhotoLayer = useProjectStore((state) => state.updatePhotoLayer);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);
  const grid = useSettingsStore((state) => state.grid);
  const maskEdit = useToolStore((state) => state.maskEdit);
  const openMaskEdit = useToolStore((state) => state.openMaskEdit);

  /** 도형 안에서 맞추는 중인 사진. 그 동안에는 캔버스의 다른 조작이 전부 멈춘다. */
  const maskLayer = useMemo((): PhotoLayer | null => {
    if (!maskEdit) return null;
    const found = project.layers.find((layer) => layer.id === maskEdit);
    return found && found.type === 'photo' && found.mask ? found : null;
  }, [maskEdit, project.layers]);

  const size = useStageSize(containerRef, project.ratio);

  const layers = useMemo(
    () => [...project.layers].sort((a, b) => a.zIndex - b.zIndex),
    [project.layers],
  );

  const handleStageRef = useCallback(
    (node: Konva.Stage | null) => {
      setStage(node);
      onStageReady(node);
    },
    [onStageReady],
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
    if (!isLive(konvaLayer)) return;
    konvaLayer?.drawHit();
    if (isLive(transformer)) transformer?.forceUpdate();
    konvaLayer?.batchDraw();
  }, [konvaLayer, transformer]);

  // 선택된 노드에 Transformer를 붙인다.
  // 레이어 목록이 바뀌면 노드 인스턴스가 새로 생기므로 다시 찾아야 한다.
  // 그리는 중에는 붙이지 않는다. 획을 긋는 손이 핸들에 걸리면 그리기가 끊긴다.
  useEffect(() => {
    if (!isLive(transformer) || !transformer) return;
    const node = selectedId && !brush && !maskLayer ? nodesRef.current.get(selectedId) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [transformer, selectedId, layers, brush, maskLayer]);

  // 사진을 맞추는 동안에는 요소 제스처가 멈춰야 한다. 대상이 없으면 훅들이 스스로 쉰다.
  const getTargetNode = useCallback(
    () => (selectedId && !maskLayer ? (nodesRef.current.get(selectedId) ?? null) : null),
    [selectedId, maskLayer],
  );

  const commitSelected = useCallback(
    (transform: NodeTransform) => {
      // 손을 뗐으면 각도 표시도 사라져야 한다. 남아 있으면 그림을 가린다.
      setAngle(null);
      if (selectedId) updateLayerTransform(selectedId, transform);
    },
    [selectedId, updateLayerTransform],
  );

  /** 제스처 도중 매 프레임. Transformer 핸들을 따라오게 하고 지금 각도를 띄운다. */
  const handleGestureUpdate = useCallback(() => {
    if (isLive(transformer)) transformer?.forceUpdate();
    const node = getTargetNode();
    if (node) setAngle(node.rotation());
  }, [transformer, getTargetNode]);

  useTwoFingerGesture({
    stage,
    getTargetNode,
    onUpdate: handleGestureUpdate,
    onCommit: commitSelected,
  });

  // PC에서는 두 손가락이 없다. 휠로 같은 동작을 할 수 있어야 개발 중 반복 확인이 빠르다.
  useWheelGesture({
    stage,
    getTargetNode,
    onUpdate: handleGestureUpdate,
    onCommit: commitSelected,
  });

  /**
   * 회전 핸들로 돌리는 동안의 각도.
   * Transformer는 자기 이벤트로만 알려 주므로 노드의 onTransform과 별개로 받아야
   * "지금 어느 앵커를 잡고 있는지"를 볼 수 있다.
   */
  useEffect(() => {
    if (!transformer) return;

    const onTransform = () => {
      const node = transformer.nodes()[0];
      if (node && transformer.getActiveAnchor() === 'rotater') setAngle(node.rotation());
    };
    const onEnd = () => setAngle(null);

    transformer.on('transform', onTransform);
    transformer.on('transformend', onEnd);

    return () => {
      transformer.off('transform', onTransform);
      transformer.off('transformend', onEnd);
    };
  }, [transformer]);

  // 겹친 요소 중 손가락 아래에 실제로 그려진 것을 고른다. 사각형 히트는 맨 위만 잡는다
  usePixelPicking(stage);

  /** 자른 사진을 꾹 누르면 도형 안에서 사진만 맞추는 모드로 들어간다. */
  useLongPress({
    konvaLayer,
    onLongPress: (layerId) => {
      if (brush || maskEdit) return;
      const target = project.layers.find((item) => item.id === layerId);
      if (target?.type === 'photo' && target.mask) openMaskEdit(layerId);
    },
  });

  useMaskGesture({
    stage,
    layer: maskLayer,
    getImageNode: () => {
      const group = maskLayer ? nodesRef.current.get(maskLayer.id) : null;
      return group?.findOne<Konva.Image>('Image') ?? null;
    },
    onCommit: (adjust: MaskAdjust) => {
      if (maskLayer) updatePhotoLayer(maskLayer.id, adjust);
    },
  });

  // 끌 때 캔버스와 다른 요소에 붙인다. 안내선은 아래에서 별도 레이어로 그린다.
  const guides = useDragSnap({
    konvaLayer,
    stage,
    canvasWidth: size?.logicalWidth ?? 0,
    canvasHeight: size?.logicalHeight ?? 0,
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
    // 그리는 중이거나 사진을 맞추는 중에는 선택을 건드릴 필요가 없다
    if (brush || maskEdit) return;
    // 레이어를 눌렀으면 그 레이어가 스스로 선택된다. 배경이나 빈 곳일 때만 해제한다.
    const target = event.target;
    if (target === target.getStage() || target.name() === BACKGROUND_NAME) {
      select(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-surface relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      /*
       * 캔버스 바깥의 어두운 여백도 빈 곳이다. 사진이 캔버스를 꽉 채우면 캔버스 안에는
       * 누를 빈 곳이 없어서, 여기서 풀어 주지 않으면 선택을 풀 길이 없다.
       */
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget || brush || maskEdit) return;
        select(null);
      }}
    >
      {size && (
        <Stage
          ref={handleStageRef}
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

            {/*
              카드는 배경 바로 위에 깔린다.
              요소가 아니라 캔버스의 한 겹이라, 스티커와 글자는 언제나 카드 위에 얹힌다.
            */}
            {project.template && (
              <TemplateContent
                template={project.template}
                canvasWidth={size.logicalWidth}
                canvasHeight={size.logicalHeight}
                onReady={handleContentReady}
                onRequestSlot={onRequestSlot}
              />
            )}

            {layers.map((layer) => (
              <LayerNode
                key={layer.id}
                layer={layer}
                onSelect={select}
                onTransformCommit={updateLayerTransform}
                registerNode={registerNode}
                onContentReady={handleContentReady}
                onRequestEdit={onRequestEdit}
                locked={maskEdit !== null}
              />
            ))}
            <SelectionTransformer onRef={setTransformer} />
          </KonvaLayer>

          {/*
            스냅 안내선.
            요소들과 같은 레이어에 두면 선 하나 때문에 사진까지 전부 다시 그려진다.
            손을 떼면 사라지므로 내보내기에는 찍히지 않는다.
          */}
          <KonvaLayer listening={false}>
            {guides.map((guide) => (
              <Line
                key={`${guide.axis}-${guide.at}`}
                points={
                  guide.axis === 'x'
                    ? [guide.at, 0, guide.at, size.logicalHeight]
                    : [0, guide.at, size.logicalWidth, guide.at]
                }
                stroke="#ff5376"
                strokeWidth={1.5 / size.scale}
                dash={[10 / size.scale, 8 / size.scale]}
              />
            ))}
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

      {/*
        보조선. 스테이지와 같은 자리에 겹쳐 둔다.
        캔버스가 아니라 위에 얹은 그림이라 결과물에는 찍히지 않는다.
      */}
      {size && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <GridOverlay kind={grid} width={size.width} height={size.height} />
        </div>
      )}

      {/*
        돌리는 동안 뜨는 각도.
        캔버스가 아니라 그 위에 띄우는 HTML이다. 캔버스에 그리면 내보내기에 찍히고,
        확대 배율에 따라 글자 크기가 같이 변해서 읽기 어려워진다.
      */}
      {angle !== null && (
        <span className="pointer-events-none absolute top-3 rounded-full bg-black/70 px-3 py-1 text-label-md tabular-nums text-white">
          {formatAngle(angle)}
        </span>
      )}
    </div>
  );
}
