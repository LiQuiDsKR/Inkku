import { Group } from 'react-konva';
import type Konva from 'konva';
import AssetContent from './AssetContent';
import DrawingContent from './DrawingContent';
import ParticleContent from './ParticleContent';
import PhotoContent from './PhotoContent';
import ShapeContent from './ShapeContent';
import TextContent from './TextContent';
import { LAYER_NODE_NAME } from './useDragSnap';
import type { NodeTransform } from './gestureMath';
import type { Layer } from '@/layers/types';

interface LayerNodeProps {
  layer: Layer;
  onSelect: (id: string) => void;
  onTransformCommit: (id: string, transform: NodeTransform) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
  /** 비동기로 그려지는 내용(사진, 스티커, 폰트)이 준비된 시점. Transformer 재계산에 쓴다. */
  onContentReady: () => void;
  /** 더블탭. 텍스트는 다시 편집, 나머지는 아직 할 일이 없다. */
  onRequestEdit: (layer: Layer) => void;
  /**
   * 잠긴 상태(사진 맞추기 중).
   * 그때는 어떤 요소도 옮기거나 고를 수 없다. 같은 손가락 동작이 두 가지 뜻을 가질 수 없다.
   */
  locked: boolean;
}

function readTransform(node: Konva.Node): NodeTransform {
  return {
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
  };
}

/**
 * 타입별로 다른 건 "무엇을 그리는가"뿐이다. 변환은 전부 상위 Group이 갖는다.
 * 새 요소 타입을 추가할 때 이 스위치에 한 줄만 넣으면 이동/회전/삭제/순서변경이 따라온다.
 */
interface LayerContentProps {
  layer: Layer;
  onReady: () => void;
}

function LayerContent({ layer, onReady }: LayerContentProps) {
  switch (layer.type) {
    case 'photo':
      return <PhotoContent layer={layer} onReady={onReady} />;
    case 'sticker':
    case 'presetLine':
      return <AssetContent layer={layer} onReady={onReady} />;
    case 'text':
      return <TextContent layer={layer} onReady={onReady} />;
    case 'shape':
      return <ShapeContent layer={layer} onReady={onReady} />;
    case 'drawing':
      return <DrawingContent layer={layer} onReady={onReady} />;
    case 'particle':
      return <ParticleContent layer={layer} onReady={onReady} />;
    default:
      // 유니온이 늘어나면 여기서 걸린다. 새 타입은 반드시 위 스위치에 한 줄을 더한다.
      return null;
  }
}

/**
 * 모든 레이어의 공통 껍데기.
 * 이동/확대/회전/투명도/선택을 여기서 한 번만 처리하면
 * 새 요소 타입을 추가할 때 그리기만 정의하면 된다.
 */
export default function LayerNode({
  layer,
  onSelect,
  onTransformCommit,
  registerNode,
  onContentReady,
  onRequestEdit,
  locked,
}: LayerNodeProps) {
  return (
    <Group
      ref={(node) => {
        registerNode(layer.id, node);
      }}
      // 스냅 계산이 "요소들"만 골라내는 표식. 배경과 카드는 이 이름이 없다.
      name={LAYER_NODE_NAME}
      // 꾹 누른 노드가 어느 레이어인지 알아내는 통로. Konva의 id는 스테이지 안에서 유일하다.
      id={layer.id}
      x={layer.x}
      y={layer.y}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!locked}
      // 탭을 기다리지 않고 누르는 즉시 선택한다. 그래야 누른 채 바로 끌 수 있다.
      onPointerDown={() => {
        if (!locked) onSelect(layer.id);
      }}
      // 폰은 dbltap, PC는 dblclick으로 온다. 둘 다 걸어야 개발 중 마우스로도 확인된다.
      onDblTap={() => onRequestEdit(layer)}
      onDblClick={() => onRequestEdit(layer)}
      // 드래그와 변형 중에는 스토어를 건드리지 않는다.
      // 매 프레임 리렌더가 돌면 제스처가 끊기고, 히스토리도 한 동작당 수십 단계가 쌓인다.
      onDragEnd={(event) => onTransformCommit(layer.id, readTransform(event.target))}
      onTransformEnd={(event) => onTransformCommit(layer.id, readTransform(event.target))}
    >
      <LayerContent layer={layer} onReady={onContentReady} />
    </Group>
  );
}
