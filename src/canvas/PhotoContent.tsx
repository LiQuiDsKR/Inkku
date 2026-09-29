import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { PhotoFrameBack, PhotoFrameFront } from './PhotoFrame';
import { maskClip } from './photoMask';
import { toFilterConfig } from './photoFilters';
import { useLayerImage } from './useLayerImage';
import { cropFit, maskFrame } from '@/layers/photoCrop';
import { framePadding } from '@/layers/photoFrame';
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
  const imageRef = useRef<Konva.Image>(null);

  const filter = toFilterConfig(layer.filter?.preset);

  /**
   * Konva 필터는 cache() 없이는 적용되지 않는다.
   * 사진 한 장을 통째로 다시 굽는 비싼 연산이라, 프리셋이 바뀌는 순간에만 한 번 한다.
   * 슬라이더로 실시간 조절을 붙일 때는 CSS filter 미리보기로 바꾸고 확정할 때만 여기로 와야 한다.
   */
  useEffect(() => {
    const node = imageRef.current;
    if (!node || !image) return;

    if (filter) {
      node.cache();
    } else {
      // 필터를 끄면 캐시도 버린다. 남겨 두면 원본 대신 마지막으로 구운 그림이 계속 보인다.
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
    // 자르기가 바뀌면 구운 그림도 다시 구워야 한다. 캐시는 그릴 당시의 잘린 모양을 그대로 담는다.
  }, [
    image,
    filter?.filters.length,
    layer.filter?.preset,
    layer.naturalWidth,
    layer.naturalHeight,
    layer.mask,
    layer.maskZoom,
    layer.maskOffset,
  ]);

  // 프레임이 바뀌면 차지하는 크기가 달라져서 선택 상자를 다시 맞춰야 한다
  useEffect(() => {
    if (image) onReady();
  }, [image, onReady, layer.border?.style, layer.mask]);

  if (!image) return null;

  const border = framePadding(layer);

  /*
   * 도형이 차지하는 자리. 자르지 않은 사진은 null이라 예전 계산이 그대로 통한다.
   *
   * 잘라 낼 영역을 미리 떼어서 넘기는 이유는 두 가지다.
   * 하나는 클리핑만 걸면 안 보이는 부분까지 이 노드의 크기로 잡혀 선택 상자가
   * 하트보다 크게 그려지기 때문이고(클리핑은 크기 계산에 반영되지 않는다),
   * 다른 하나는 도형 안에서 사진을 밀고 키우는 조작이 곧 이 영역을 옮기는 일이기 때문이다.
   */
  const shape = maskFrame(layer);
  const crop = shape
    ? cropFit({ width: image.width, height: image.height }, shape, layer.maskZoom, layer.maskOffset)
        .crop
    : undefined;

  const totalWidth = shape?.width ?? layer.naturalWidth + border.padX * 2;
  const totalHeight = shape?.height ?? layer.naturalHeight + border.padTop + border.padBottom;

  /*
   * 프레임은 종이(사진 뒤)와 장식(사진 위)으로 나뉜다.
   * 도형으로 자른 사진에는 두르지 않는다. 하트 둘레의 네모난 종이는 액자로 보이지 않는다.
   */
  const geometry = {
    style: layer.border?.style ?? ('none' as const),
    color: layer.border?.color ?? '#ffffff',
    width: totalWidth,
    height: totalHeight,
    photoX: border.padX,
    photoY: border.padTop,
    photoWidth: layer.naturalWidth,
    photoHeight: layer.naturalHeight,
  };
  const frame = shape ? null : PhotoFrameBack(geometry);
  const frameFront = shape ? null : PhotoFrameFront(geometry);

  return (
    // 그룹 원점을 테두리까지 포함한 한가운데로 옮긴다. 회전축이 사진 중심이어야 손맛이 자연스럽다.
    <Group
      offsetX={totalWidth / 2}
      offsetY={totalHeight / 2}
      clipFunc={layer.mask ? maskClip(layer.mask, totalWidth, totalHeight) : undefined}
    >
      {frame}
      <KonvaImage
        ref={imageRef}
        image={image}
        // 자른 사진은 도형 프레임을 꽉 채우고, 자르지 않은 사진은 테두리 안쪽에 놓인다
        x={shape ? 0 : border.padX}
        y={shape ? 0 : border.padTop}
        width={shape ? shape.width : layer.naturalWidth}
        height={shape ? shape.height : layer.naturalHeight}
        crop={crop}
        filters={filter?.filters}
        brightness={filter?.brightness ?? 0}
        contrast={filter?.contrast ?? 0}
        hue={filter?.hue ?? 0}
        saturation={filter?.saturation ?? 0}
      />
      {frameFront}
    </Group>
  );
}
