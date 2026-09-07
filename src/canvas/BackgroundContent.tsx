import { useEffect, useRef } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';
import Konva from 'konva';
import { gradientEndpoints } from './gradientPoints';
import { useAssetImage } from './useAssetImage';
import { useLayerImage } from './useLayerImage';
import type { Background } from '@/layers/types';

/** 배경을 누르면 선택이 풀린다. 이름으로 구분해야 레이어를 누른 것과 헷갈리지 않는다. */
export const BACKGROUND_NAME = 'background';

/** 텍스처 타일 한 장이 논리 캔버스에서 차지할 크기. 원본(256)보다 줄여야 무늬가 촘촘해 보인다. */
const TEXTURE_TILE = 180;

interface BackgroundContentProps {
  background: Background;
  width: number;
  height: number;
}

export default function BackgroundContent({ background, width, height }: BackgroundContentProps) {
  switch (background.type) {
    case 'gradient': {
      const { start, end } = gradientEndpoints(background.angle, width, height);
      return (
        <Rect
          name={BACKGROUND_NAME}
          width={width}
          height={height}
          fillLinearGradientStartPoint={start}
          fillLinearGradientEndPoint={end}
          fillLinearGradientColorStops={[0, background.from, 1, background.to]}
        />
      );
    }
    case 'texture':
      return <TextureBackground url={background.assetUrl} width={width} height={height} />;
    case 'photoBlur':
      return (
        <PhotoBlurBackground
          imageId={background.imageId}
          blur={background.blur}
          width={width}
          height={height}
        />
      );
    case 'solid':
    default:
      return <Rect name={BACKGROUND_NAME} width={width} height={height} fill={background.color} />;
  }
}

interface TextureBackgroundProps {
  url: string;
  width: number;
  height: number;
}

function TextureBackground({ url, width, height }: TextureBackgroundProps) {
  const image = useAssetImage(url);

  // 늘려 그리지 않고 타일로 반복한다. 비율이 다른 캔버스마다 무늬가 찌그러지는 걸 막는다.
  const scale = image ? TEXTURE_TILE / image.width : 1;

  return (
    <Rect
      name={BACKGROUND_NAME}
      width={width}
      height={height}
      fill={image ? undefined : '#ffffff'}
      fillPatternImage={image ?? undefined}
      fillPatternRepeat="repeat"
      fillPatternScaleX={scale}
      fillPatternScaleY={scale}
    />
  );
}

interface PhotoBlurBackgroundProps {
  imageId: string;
  blur: number;
  width: number;
  height: number;
}

/** 사진을 크게 깔고 흐리게 만든 배경. 여백 색을 고민하지 않아도 되어 결과물이 쉽게 그럴듯해진다. */
function PhotoBlurBackground({ imageId, blur, width, height }: PhotoBlurBackgroundProps) {
  const image = useLayerImage(imageId);
  const nodeRef = useRef<Konva.Image>(null);

  /**
   * Konva 필터는 cache() 없이는 적용되지 않는다.
   * 비용이 큰 연산이지만 배경은 값이 고정이라 한 번만 굽고 끝난다.
   * 슬라이더로 실시간 조절을 붙일 때는 CSS filter 미리보기로 바꿔야 한다.
   */
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !image) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [image, blur, width, height]);

  if (!image) {
    return <Rect name={BACKGROUND_NAME} width={width} height={height} fill="#ffffff" />;
  }

  // 캔버스를 꽉 채우도록 긴 변에 맞춘다. 남는 쪽은 잘려 나가지만 배경이라 문제되지 않는다.
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  return (
    <KonvaImage
      ref={nodeRef}
      name={BACKGROUND_NAME}
      image={image}
      x={(width - drawWidth) / 2}
      y={(height - drawHeight) / 2}
      width={drawWidth}
      height={drawHeight}
      filters={[Konva.Filters.Blur]}
      blurRadius={blur}
    />
  );
}
