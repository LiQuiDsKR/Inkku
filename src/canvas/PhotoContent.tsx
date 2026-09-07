import { useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useLayerImage } from './useLayerImage';
import type { PhotoLayer } from '@/layers/types';

interface PhotoContentProps {
  layer: PhotoLayer;
  /** 이미지가 도착해 크기가 정해진 순간을 알린다. */
  onReady: () => void;
}

/**
 * 사진의 그리기만 담당한다. 이동/확대/회전은 상위 Group이 갖는다.
 * 좌우반전을 layer.scaleX의 부호로 표현하지 않는 이유는,
 * 제스처 계산이 음수 배율을 만나면 회전 축이 뒤집혀 손가락과 반대로 도는 문제가 생기기 때문이다.
 */
export default function PhotoContent({ layer, onReady }: PhotoContentProps) {
  const image = useLayerImage(layer.imageId);

  // 이미지는 IndexedDB에서 비동기로 온다. 그전까지 Group은 크기가 0이라
  // Transformer가 0짜리 박스를 잡고 앵커가 한 점에 뭉친다. 도착 시점에 다시 재게 한다.
  useEffect(() => {
    if (image) onReady();
  }, [image, onReady]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      width={layer.naturalWidth}
      height={layer.naturalHeight}
      // 오프셋을 절반으로 두면 그룹 원점이 사진 한가운데가 된다. 회전축이 중심이어야 손맛이 자연스럽다.
      offsetX={layer.naturalWidth / 2}
      offsetY={layer.naturalHeight / 2}
      scaleX={layer.flipX ? -1 : 1}
    />
  );
}
