import { useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useAssetImage } from './useAssetImage';
import type { PresetLineLayer, StickerLayer } from '@/layers/types';

/**
 * 정적 에셋으로 그리는 레이어의 공통 렌더러.
 *
 * 스티커와 꾸밈선은 타입만 다르고 그리는 방식은 같다(처음 놓이는 크기만 다르다).
 * 그리기를 두 벌 두면 한쪽만 고치는 실수가 난다.
 */
interface AssetContentProps {
  layer: StickerLayer | PresetLineLayer;
  /** 이미지가 도착해 크기가 정해진 순간을 알린다. 히트 그래프와 Transformer를 다시 맞춰야 한다. */
  onReady: () => void;
}

export default function AssetContent({ layer, onReady }: AssetContentProps) {
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
      // 오프셋을 절반으로 두면 그룹 원점이 한가운데가 된다. 회전축이 중심이어야 손맛이 자연스럽다.
      offsetX={layer.naturalWidth / 2}
      offsetY={layer.naturalHeight / 2}
      scaleX={layer.flipX ? -1 : 1}
    />
  );
}
