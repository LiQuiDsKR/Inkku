import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import type Konva from 'konva';
import { toFilterConfig } from './photoFilters';
import { useLayerImage } from './useLayerImage';
import { BORDER_RATIO, POLAROID_BOTTOM_RATIO } from '@/layers/photoStyle';
import type { PhotoLayer } from '@/layers/types';

interface PhotoContentProps {
  layer: PhotoLayer;
  /** 이미지가 도착해 크기가 정해진 순간을 알린다. */
  onReady: () => void;
}

interface Frame {
  padX: number;
  padTop: number;
  padBottom: number;
}

/** 테두리가 차지하는 여백(사진 짧은 변 기준). 없으면 0이라 나머지 계산이 그대로 통한다. */
function frameOf(layer: PhotoLayer): Frame {
  const style = layer.border?.style ?? 'none';
  if (style === 'none') return { padX: 0, padTop: 0, padBottom: 0 };

  const base = Math.min(layer.naturalWidth, layer.naturalHeight);
  const pad = base * (layer.border?.width ?? BORDER_RATIO);
  if (style === 'polaroid') {
    return { padX: pad, padTop: pad, padBottom: base * POLAROID_BOTTOM_RATIO };
  }
  return { padX: pad, padTop: pad, padBottom: pad };
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
  }, [image, filter?.filters.length, layer.filter?.preset, layer.naturalWidth, layer.naturalHeight]);

  useEffect(() => {
    if (image) onReady();
  }, [image, onReady, layer.border?.style]);

  if (!image) return null;

  const frame = frameOf(layer);
  const totalWidth = layer.naturalWidth + frame.padX * 2;
  const totalHeight = layer.naturalHeight + frame.padTop + frame.padBottom;

  return (
    // 그룹 원점을 테두리까지 포함한 한가운데로 옮긴다. 회전축이 사진 중심이어야 손맛이 자연스럽다.
    <Group offsetX={totalWidth / 2} offsetY={totalHeight / 2} scaleX={layer.flipX ? -1 : 1}>
      {frame.padX > 0 && (
        <Rect
          width={totalWidth}
          height={totalHeight}
          fill={layer.border?.color ?? '#ffffff'}
          // 종이 느낌을 내는 그림자. 값이 고정이라 필터와 달리 캐시가 필요 없다.
          shadowColor="rgba(0,0,0,0.35)"
          shadowBlur={totalWidth * 0.02}
          shadowOffsetY={totalWidth * 0.006}
        />
      )}
      <KonvaImage
        ref={imageRef}
        image={image}
        x={frame.padX}
        y={frame.padTop}
        width={layer.naturalWidth}
        height={layer.naturalHeight}
        filters={filter?.filters}
        brightness={filter?.brightness ?? 0}
        contrast={filter?.contrast ?? 0}
        hue={filter?.hue ?? 0}
        saturation={filter?.saturation ?? 0}
      />
    </Group>
  );
}
