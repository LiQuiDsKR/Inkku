import { useEffect, useMemo } from 'react';
import { Shape } from 'react-konva';
import { drawTextSticker } from './drawTextSticker';
import { useFontReady } from '@/fonts/useFontReady';
import { layoutTextSticker } from '@/layers/textStickerLayout';
import type { TextStickerLayer } from '@/layers/types';

interface TextStickerContentProps {
  layer: TextStickerLayer;
  onReady: () => void;
}

/**
 * 문구 스티커의 그리기만 담당한다. 이동/확대/회전은 상위 Group이 갖는다.
 *
 * Konva의 Text와 Path를 조합하지 않고 Shape 하나에 직접 그린다(`drawTextSticker`).
 * 패널 견본이 같은 함수로 그리므로, 고를 때 본 스티커와 붙은 스티커가 같다.
 */
export default function TextStickerContent({ layer, onReady }: TextStickerContentProps) {
  // 폰트가 늦게 오면 폴백 폰트의 폭으로 도형을 잡아 둔 채 굳는다. 도착하면 다시 잰다.
  const fontToken = useFontReady(layer.style.fontId, layer.text);

  const layout = useMemo(
    () => layoutTextSticker(layer.text, layer.style),
    // fontToken은 값을 쓰지 않는다. 폰트가 도착했을 때 다시 재게 하는 신호다.
    [layer.text, layer.style, fontToken],
  );

  // 크기가 바뀌면 선택 상자와 히트 영역을 다시 맞춰야 한다
  useEffect(() => {
    onReady();
  }, [layout, onReady]);

  const { bounds } = layout;

  return (
    <Shape
      // 원점이 글자 한가운데인 좌표를 그대로 쓰도록, 노드를 차지하는 사각형의 왼쪽 위에 놓는다
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      sceneFunc={(context) => {
        const ctx = context._context;
        ctx.save();
        ctx.translate(-bounds.x, -bounds.y);
        drawTextSticker(ctx, layout);
        ctx.restore();
      }}
      // 투명한 여백까지 눌린다. 글자 사이 빈틈을 누를 때마다 뒤의 사진이 잡히면 옮길 수가 없다.
      hitFunc={(context, shape) => {
        context.beginPath();
        context.rect(0, 0, bounds.width, bounds.height);
        context.closePath();
        context.fillStrokeShape(shape);
      }}
      /*
       * 실제로 칠하지 않는 채우기와 선이다. Konva는 채우기와 선이 함께 있는 도형만
       * 투명도를 줄였을 때 버퍼에 한 번에 그린 뒤 겹쳐 올린다. 이 표시가 없으면 투명도를 줄인
       * 스티커에서 바탕이 글자 밑으로, 글자 테두리가 채우기 밑으로 비쳐 보인다.
       * 선은 크기 계산에 들어가므로 보이지 않을 만큼 가늘게 둔다.
       */
      fill="#000000"
      stroke="#000000"
      strokeWidth={0.0001}
      hitStrokeWidth={0}
    />
  );
}
