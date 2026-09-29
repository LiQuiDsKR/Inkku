import { useEffect } from 'react';
import { Group, Path, Rect } from 'react-konva';
import { useOptionalLayerImage } from './useLayerImage';
import { cornerRadius } from './templateGeometry';
import { useToolStore } from '@/store/toolStore';
import { resolveFill } from '@/templates/types';
import type { TemplatePalette, TemplateSlotPart } from '@/templates/types';

/** 빈 자리에 그리는 더하기 표시의 선. 아이콘 경로와 같은 24 좌표계다. */
const PLUS_PATH = 'M12 5.5v13 M5.5 12h13';

interface TemplateSlotShapeProps {
  part: TemplateSlotPart;
  imageId: string | null;
  palette: TemplatePalette;
  onTap: () => void;
  onReady: () => void;
}

/**
 * 템플릿의 사진 자리.
 *
 * Konva.Image 대신 무늬로 채운 Rect를 쓴다. Image에는 모서리 둥글리기가 없어서
 * 잘라 내려면 그룹마다 클리핑 경로를 만들어야 하는데, Rect의 cornerRadius는 공짜다.
 * 무늬는 원본 해상도 그대로 들어가므로 내보내기에서도 또렷하다.
 */
export default function TemplateSlotShape({
  part,
  imageId,
  palette,
  onTap,
  onReady,
}: TemplateSlotShapeProps) {
  const image = useOptionalLayerImage(imageId);
  const exporting = useToolStore((state) => state.exporting);

  // 사진이 도착하면 히트 그래프를 다시 맞춰야 한다
  useEffect(() => {
    if (image) onReady();
  }, [image, onReady]);

  const radius = cornerRadius(part.radius);

  // 자리를 꽉 채우도록 긴 변에 맞추고, 남는 쪽은 가운데만 남기고 잘라 낸다.
  // 무늬 오프셋은 배율이 곱해지기 전의 원본 픽셀 기준이다.
  const patternScale = image
    ? Math.max(part.width / image.width, part.height / image.height)
    : 1;

  // 더하기 표시는 자리가 작아지면 함께 작아진다. 프로필 사진 자리에 큰 표시가 들어가면 자리를 덮는다.
  const mark = Math.min(72, Math.min(part.width, part.height) * 0.44);
  const centerX = part.x + part.width / 2;
  const centerY = part.y + part.height / 2;
  const iconScale = (mark * 0.62) / 24;

  return (
    /*
     * 카드에서 유일하게 누를 수 있는 곳이다.
     * 카드 자체는 배경처럼 이벤트를 받지 않지만, 사진 자리는 눌러서 채우고 바꿔야 한다.
     */
    <Group onClick={onTap} onTap={onTap}>
      <Rect
        x={part.x}
        y={part.y}
        width={part.width}
        height={part.height}
        cornerRadius={radius}
        fill={image ? undefined : resolveFill('slot', palette)}
        fillPatternImage={image ?? undefined}
        fillPatternRepeat="no-repeat"
        fillPatternScaleX={patternScale}
        fillPatternScaleY={patternScale}
        fillPatternOffsetX={image ? (image.width - part.width / patternScale) / 2 : 0}
        fillPatternOffsetY={image ? (image.height - part.height / patternScale) / 2 : 0}
      />
      {/*
        더하기 표시는 편집용 안내지 카드의 내용이 아니다. 굽는 동안에는 숨긴다.
        빈 자리를 그대로 두는 사람도 있는데, 결과물에 누르라는 표시가 찍혀 있으면 미완성으로 보인다.
        채운 자리에도 띄운다. 카드는 잡아서 옮기는 물건이 아니게 됐으니, 사진을 바꾸는 길이
        "여기를 누르라"는 표시 말고는 없다.
        표시 자체는 카드 색과 무관하게 흰 바탕에 검은 선이라 어떤 변형에서도 눈에 걸린다.
      */}
      {!exporting && (
        <>
          <Rect
            x={centerX - mark / 2}
            y={centerY - mark / 2}
            width={mark}
            height={mark}
            cornerRadius={mark * 0.28}
            fill="#ffffff"
            stroke="#16181d"
            strokeWidth={mark * 0.055}
          />
          <Path
            x={centerX - (mark * 0.62) / 2}
            y={centerY - (mark * 0.62) / 2}
            scaleX={iconScale}
            scaleY={iconScale}
            data={PLUS_PATH}
            stroke="#16181d"
            strokeWidth={2.4}
            lineCap="round"
            listening={false}
          />
        </>
      )}
    </Group>
  );
}
