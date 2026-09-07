import { useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useAssetImage } from './useAssetImage';
import type { StickerLayer } from '@/layers/types';

interface StickerContentProps {
  layer: StickerLayer;
  /** 이미지가 도착해 크기가 정해진 순간을 알린다. 히트 그래프와 Transformer를 다시 맞춰야 한다. */
  onReady: () => void;
}

/**
 * 스티커의 그리기만 담당한다. 이동/확대/회전은 상위 Group이 갖는다.
 * 사진과 구조가 같지만 픽셀 출처가 IndexedDB가 아니라 정적 URL이라는 점만 다르다.
 */
export default function StickerContent({ layer, onReady }: StickerContentProps) {
  const image = useAssetImage(layer.assetUrl);

  useEffect(() => {
    if (image) onReady();
  }, [image, onReady]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      width={layer.naturalWidth}
      height={layer.naturalHeight}
      // 오프셋을 절반으로 두면 그룹 원점이 스티커 한가운데가 된다. 회전축이 중심이어야 손맛이 자연스럽다.
      offsetX={layer.naturalWidth / 2}
      offsetY={layer.naturalHeight / 2}
      scaleX={layer.flipX ? -1 : 1}
    />
  );
}
