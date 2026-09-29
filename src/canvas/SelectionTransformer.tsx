import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { ROTATION_SNAPS } from './snapping';

/** 손가락으로 잡을 수 있는 최소 크기. 마우스 기준(10px 남짓)으로 두면 폰에서 못 잡는다. */
const ANCHOR_SIZE = 22;
const STROKE_WIDTH = 1.5;
const ROTATE_OFFSET = 30;
const MIN_BOX = 12;

interface SelectionTransformerProps {
  onRef: (node: Konva.Transformer | null) => void;
}

export default function SelectionTransformer({ onRef }: SelectionTransformerProps) {
  return (
    <Transformer
      ref={onRef}
      rotateEnabled
      // 모서리만 남긴다. 변 앵커를 두면 가로세로가 따로 늘어나,
      // 두 손가락 확대(균등)와 결과가 달라져서 일관성이 깨진다.
      enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
      // Konva Transformer는 스테이지 축소 배율을 스스로 보정한다.
      // 여기에 역수를 또 곱하면 핸들이 배율의 제곱만큼 커진다. 화면 픽셀 값을 그대로 넣는다.
      anchorSize={ANCHOR_SIZE}
      anchorCornerRadius={ANCHOR_SIZE * 0.5}
      anchorStrokeWidth={STROKE_WIDTH}
      borderStrokeWidth={STROKE_WIDTH}
      rotateAnchorOffset={ROTATE_OFFSET}
      // 45도마다 붙는다. 손으로 정확히 90도를 맞추는 것은 사실상 불가능하다.
      rotationSnaps={[...ROTATION_SNAPS]}
      rotationSnapTolerance={6}
      // 선택 표시 색은 디자인 시스템의 주 색(피치핑크)이다.
      // 사진 위 어떤 색과도 겹치지 않아 경계가 또렷하게 보인다.
      borderStroke="#ff5376"
      anchorStroke="#ff5376"
      anchorFill="#ffffff"
      ignoreStroke
      // 0에 가깝게 줄이면 다시 잡을 수 없게 된다
      boundBoxFunc={(oldBox, newBox) =>
        newBox.width < MIN_BOX || newBox.height < MIN_BOX ? oldBox : newBox
      }
    />
  );
}
