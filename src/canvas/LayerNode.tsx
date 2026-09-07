import { Group } from 'react-konva';
import type Konva from 'konva';
import PhotoContent from './PhotoContent';
import type { NodeTransform } from './gestureMath';
import type { Layer } from '@/layers/types';

interface LayerNodeProps {
  layer: Layer;
  onSelect: (id: string) => void;
  onTransformCommit: (id: string, transform: NodeTransform) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
  /** 비동기로 그려지는 내용(사진 등)이 준비된 시점. Transformer 재계산에 쓴다. */
  onContentReady: () => void;
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

/** 타입별로 다른 건 "무엇을 그리는가"뿐이다. 변환은 전부 상위 Group이 갖는다. */
function LayerContent({ layer, onReady }: { layer: Layer; onReady: () => void }) {
  switch (layer.type) {
    case 'photo':
      return <PhotoContent layer={layer} onReady={onReady} />;
    default:
      // 스티커, 텍스트, 낙서, 도형, 프리셋 선은 Phase 2와 3에서 채운다
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
}: LayerNodeProps) {
  return (
    <Group
      ref={(node) => {
        registerNode(layer.id, node);
      }}
      x={layer.x}
      y={layer.y}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      // 탭을 기다리지 않고 누르는 즉시 선택한다. 그래야 누른 채 바로 끌 수 있다.
      onPointerDown={() => onSelect(layer.id)}
      // 드래그와 변형 중에는 스토어를 건드리지 않는다.
      // 매 프레임 리렌더가 돌면 제스처가 끊기고, 히스토리도 한 동작당 수십 단계가 쌓인다.
      onDragEnd={(event) => onTransformCommit(layer.id, readTransform(event.target))}
      onTransformEnd={(event) => onTransformCommit(layer.id, readTransform(event.target))}
    >
      <LayerContent layer={layer} onReady={onContentReady} />
    </Group>
  );
}
