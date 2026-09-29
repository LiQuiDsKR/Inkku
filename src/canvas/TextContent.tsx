import { useLayoutEffect, useRef } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import { useFontReady } from '@/fonts/useFontReady';
import type { TextLayer } from '@/layers/types';

interface TextContentProps {
  layer: TextLayer;
  onReady: () => void;
}

/**
 * 글자의 그리기만 담당한다.
 *
 * 크기를 배율이 아니라 fontSize로 다루는 이유는, 배율로 키우면 외곽선과 그림자까지
 * 같은 비율로 늘어나서 "크게 쓰되 테두리는 얇게" 같은 조합을 만들 수 없기 때문이다.
 */
export default function TextContent({ layer, onReady }: TextContentProps) {
  const nodeRef = useRef<Konva.Text>(null);

  // 폰트가 늦게 도착하면 폴백 폰트로 그려진 채 굳는다. 도착 시점에 다시 재고 다시 그린다.
  const fontToken = useFontReady(layer.fontId, layer.content);

  /**
   * 글자는 이미지와 달리 실제로 그려 봐야 크기를 알 수 있다.
   * 그려진 뒤 중앙으로 오프셋을 맞춰야 회전축이 글자 한가운데가 된다.
   * useEffect가 아니라 useLayoutEffect여야 어긋난 위치가 한 프레임 보이지 않는다.
   */
  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    node.offsetX(node.width() / 2);
    node.offsetY(node.height() / 2);
    onReady();
  }, [
    layer.content,
    layer.fontFamily,
    layer.fontSize,
    layer.lineHeight,
    layer.align,
    layer.stroke?.width,
    fontToken,
    onReady,
  ]);

  return (
    <Text
      ref={nodeRef}
      text={layer.content}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      lineHeight={layer.lineHeight}
      align={layer.align}
      fill={layer.color}
      stroke={layer.stroke?.color}
      strokeWidth={layer.stroke?.width ?? 0}
      // 기본값은 외곽선을 글자 위에 덮어 그려서 얇은 획이 잡아먹힌다. 채우기를 나중에 그린다.
      fillAfterStrokeEnabled
      shadowColor={layer.shadow?.color}
      shadowBlur={layer.shadow?.blur ?? 0}
      shadowOffsetX={layer.shadow?.offsetX ?? 0}
      shadowOffsetY={layer.shadow?.offsetY ?? 0}
    />
  );
}
