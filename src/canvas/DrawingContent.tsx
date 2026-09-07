import { useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useLayerImage } from './useLayerImage';
import type { DrawingLayer } from '@/layers/types';

interface DrawingContentProps {
  layer: DrawingLayer;
  onReady: () => void;
}

/**
 * 굳힌 낙서의 그리기.
 *
 * 저장된 이미지는 논리 크기보다 크게 구워져 있다(내보내기 화질용).
 * 그래서 이미지의 원본 픽셀이 아니라 레이어가 들고 있는 논리 크기로 그린다.
 */
export default function DrawingContent({ layer, onReady }: DrawingContentProps) {
  const image = useLayerImage(layer.imageId);

  useEffect(() => {
    if (image) onReady();
  }, [image, onReady]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      width={layer.width}
      height={layer.height}
      offsetX={layer.width / 2}
      offsetY={layer.height / 2}
      scaleX={layer.flipX ? -1 : 1}
    />
  );
}
