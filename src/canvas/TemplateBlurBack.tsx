import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { roundedClip } from './templateGeometry';
import { useOptionalLayerImage } from './useLayerImage';
import type { TemplateRadius } from '@/templates/types';

/** 흐림 반경(설계 좌표 기준). 앨범 사진의 색만 남고 형태는 읽히지 않는 정도다. */
const BLUR_RADIUS = 44;

interface TemplateBlurBackProps {
  imageId: string | null;
  width: number;
  height: number;
  radius?: TemplateRadius;
  onReady: () => void;
}

/**
 * 카드 뒤에 흐리게 까는 사진.
 *
 * 슬롯에 넣은 사진을 그대로 쓴다. 사진 한 장으로 카드 전체의 색이 정해지므로
 * 사용자가 색을 고를 일이 없어진다. 실제 음악 앱이 쓰는 방식이기도 하다.
 */
export default function TemplateBlurBack({
  imageId,
  width,
  height,
  radius,
  onReady,
}: TemplateBlurBackProps) {
  const image = useOptionalLayerImage(imageId);
  const nodeRef = useRef<Konva.Image>(null);

  /**
   * Konva 필터는 cache() 없이는 적용되지 않는다.
   * 비싼 연산이지만 값이 고정이라 사진이 바뀔 때만 한 번 굽는다.
   * 구운 그림은 화면 배율 기준이라 내보내기에서 더 흐릿해지는데, 어차피 흐린 배경이라 문제되지 않는다.
   */
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !image) return;
    node.cache();
    node.getLayer()?.batchDraw();
    onReady();
  }, [image, width, height, onReady]);

  if (!image) return null;

  // 카드를 꽉 채우도록 긴 변에 맞춘다. 남는 쪽은 잘려도 배경이라 상관없다.
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  return (
    <Group clipFunc={roundedClip(width, height, radius)} listening={false}>
      <KonvaImage
        ref={nodeRef}
        image={image}
        x={(width - drawWidth) / 2}
        y={(height - drawHeight) / 2}
        width={drawWidth}
        height={drawHeight}
        filters={[Konva.Filters.Blur]}
        blurRadius={BLUR_RADIUS}
      />
    </Group>
  );
}
