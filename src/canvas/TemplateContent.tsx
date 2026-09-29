import { useEffect } from 'react';
import { Group, Path, Rect, Text } from 'react-konva';
import TemplateBlurBack from './TemplateBlurBack';
import TemplateSlotShape from './TemplateSlotShape';
import { cornerRadius, fitTemplate } from './templateGeometry';
import { findFont } from '@/fonts/catalog';
import { CARD_FONT_FAMILY, useTemplateFonts, useTemplateTextFonts } from '@/fonts/useTemplateFonts';
import { layoutBubble } from '@/templates/bubble';
import { findTemplate, findVariant } from '@/templates/catalog';
import { findIconPath } from '@/templates/icons';
import { fieldValue, partText, resolveFill } from '@/templates/types';
import type { ProjectTemplate } from '@/layers/types';
import type {
  TemplateBubblePart,
  TemplateIconPart,
  TemplatePalette,
  TemplatePart,
  TemplateRadius,
  TemplateRectPart,
  TemplateSpec,
  TemplateTextPart,
} from '@/templates/types';

/** 카드가 배경에서 떠 보이게 하는 그림자. 값이 고정이라 필터와 달리 캐시가 필요 없다. */
const SHADOW_COLOR = 'rgba(0,0,0,0.38)';

/** 선으로 그리는 아이콘의 두께(24 좌표계 기준). 카드가 커져도 선 굵기의 인상은 같아야 한다. */
const ICON_STROKE = 2.1;

interface TemplateContentProps {
  template: ProjectTemplate;
  /** 캔버스 논리 크기. 카드는 여기에 맞춰 놓인다. */
  canvasWidth: number;
  canvasHeight: number;
  onReady: () => void;
  /** 사진 자리를 눌렀다. 파일 고르기는 UI 쪽 일이라 위로 올려 보낸다. */
  onRequestSlot: (slotId: string) => void;
}

/** 카드 바깥 모서리. "스펙의 첫 파트가 카드 면"이라는 약속을 아는 곳을 여기 하나로 묶는다. */
function cardRadius(spec: TemplateSpec): TemplateRadius | undefined {
  const first = spec.parts[0];
  return first && first.kind === 'rect' ? first.radius : undefined;
}

function RectPart({ part, palette }: { part: TemplateRectPart; palette: TemplatePalette }) {
  return (
    <Rect
      x={part.x}
      y={part.y}
      width={part.width}
      height={part.height}
      cornerRadius={cornerRadius(part.radius)}
      fill={resolveFill(part.fill, palette)}
      opacity={part.opacity}
      shadowColor={part.shadow ? SHADOW_COLOR : undefined}
      shadowBlur={part.shadow}
      shadowOffsetY={part.shadow ? part.shadow * 0.35 : undefined}
      /*
       * 카드 면은 이벤트를 받지 않는다.
       * 카드는 배경과 같은 층위라 누른다고 잡히는 것이 없어야 하고,
       * 눌린 자리가 스테이지까지 내려가야 "빈 곳을 눌러 선택 해제"가 카드 위에서도 통한다.
       */
      listening={false}
    />
  );
}

interface TextPartProps {
  part: TemplateTextPart;
  spec: TemplateSpec;
  fields: Readonly<Record<string, string>>;
  palette: TemplatePalette;
}

function TextPart({ part, spec, fields, palette }: TextPartProps) {
  return (
    <Text
      x={part.x}
      y={part.y}
      width={part.width}
      text={partText(part, spec, fields)}
      fontSize={part.size}
      // Konva는 fontStyle을 CSS font 앞자리에 그대로 붙인다. 숫자 굵기가 그대로 통한다.
      fontStyle={part.weight ? String(part.weight) : undefined}
      fontFamily={part.fontId ? findFont(part.fontId).family : CARD_FONT_FAMILY}
      fill={resolveFill(part.fill, palette)}
      align={part.align}
      lineHeight={part.lineHeight ?? 1.2}
      /*
       * 기본은 한 줄이다. 긴 글이 줄바꿈되면 아래에 놓인 요소를 덮어서 카드가 무너진다.
       * 대신 넘치는 글은 말줄임으로 끊어서 "여기까지만 들어간다"를 보여 준다.
       */
      wrap={part.multiline ? 'word' : 'none'}
      ellipsis={!part.multiline}
      listening={false}
    />
  );
}

interface BubblePartProps {
  part: TemplateBubblePart;
  spec: TemplateSpec;
  fields: Readonly<Record<string, string>>;
  palette: TemplatePalette;
}

/**
 * 글에 맞춰 늘었다 줄었다 하는 말풍선.
 *
 * 줄 나누기를 Konva에 맡기지 않고 미리 나눠서 넘긴다.
 * 줄 수를 알아야 말풍선 높이를 정할 수 있고, 썸네일(SVG)과 같은 모양이 나온다.
 */
function BubblePart({ part, spec, fields, palette }: BubblePartProps) {
  const text = fieldValue(spec, fields, part.field);
  const layout = layoutBubble(part, text, CARD_FONT_FAMILY);

  return (
    <>
      <Rect
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        cornerRadius={cornerRadius(part.radius)}
        fill={resolveFill(part.fill, palette)}
        listening={false}
      />
      <Text
        x={layout.textX}
        y={layout.textY}
        text={layout.lines.join('\n')}
        fontSize={part.size}
        fontStyle={part.weight ? String(part.weight) : undefined}
        fontFamily={CARD_FONT_FAMILY}
        fill={resolveFill(part.textFill, palette)}
        lineHeight={part.lineHeight ?? 1.3}
        wrap="none"
        listening={false}
      />
      {layout.time && (
        <Text
          x={layout.time.x}
          y={layout.time.y}
          text={layout.time.text}
          fontSize={layout.time.size}
          fontFamily={CARD_FONT_FAMILY}
          fill={resolveFill(part.timeFill ?? 'inkMuted', palette)}
          listening={false}
        />
      )}
    </>
  );
}

function IconPart({ part, palette }: { part: TemplateIconPart; palette: TemplatePalette }) {
  const path = findIconPath(part.icon);
  // 스펙의 오타 하나로 카드 전체가 죽지 않게 한다
  if (!path) return null;

  const scale = part.size / 24;
  const color = resolveFill(part.fill, palette);

  return (
    <Path
      x={part.x}
      y={part.y}
      scaleX={scale}
      scaleY={scale}
      data={path}
      fill={part.solid ? color : undefined}
      stroke={part.solid ? undefined : color}
      strokeWidth={part.solid ? 0 : ICON_STROKE}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  );
}

/**
 * 템플릿 카드의 그리기만 담당한다.
 *
 * 무엇을 어디에 그릴지는 전부 src/templates의 스펙이 갖는다. 여기는 그 목록을 Konva 노드로 옮길 뿐이다.
 * 새 카드를 넣을 때 이 파일을 고치지 않아도 되는 것이 이 구조의 목적이다.
 *
 * 카드는 요소가 아니라 배경 다음 겹이다. 그래서 배율과 자리를 레이어처럼 값으로 들고 있지 않고
 * 캔버스 크기에서 매번 계산한다. 비율을 바꿔도 카드는 알아서 새 캔버스에 맞는다.
 */
export default function TemplateContent({
  template,
  canvasWidth,
  canvasHeight,
  onReady,
  onRequestSlot,
}: TemplateContentProps) {
  const spec = findTemplate(template.templateId);
  const variant = spec ? findVariant(spec, template.variantId) : null;

  // 폰트가 도착하면 값이 오른다. 카드를 다시 만들어 글자 폭을 새 폰트로 다시 재게 한다.
  const fontToken = useTemplateFonts(spec);
  useTemplateTextFonts(spec, Object.values(template.fields).join(''));

  // 글과 사진이 바뀌면 히트 그래프를 다시 맞춰야 한다
  useEffect(() => {
    onReady();
  }, [onReady, fontToken, template.variantId, template.fields, template.slots]);

  if (!spec || !variant) return null;

  const palette = variant.palette;
  const fit = fitTemplate(spec, canvasWidth, canvasHeight);

  return (
    <Group key={fontToken} x={fit.x} y={fit.y} scaleX={fit.scale} scaleY={fit.scale}>
      {/* 블러 배경은 카드 면보다 먼저 그린다. 카드 면이 반투명이라 그 위로 색이 비친다 */}
      {variant.blurSlot && (
        <TemplateBlurBack
          imageId={template.slots[variant.blurSlot] ?? null}
          width={spec.width}
          height={spec.height}
          radius={cardRadius(spec)}
          onReady={onReady}
        />
      )}

      {spec.parts.map((part: TemplatePart, index: number) => {
        switch (part.kind) {
          case 'rect':
            return <RectPart key={index} part={part} palette={palette} />;
          case 'text':
            return (
              <TextPart
                key={index}
                part={part}
                spec={spec}
                fields={template.fields}
                palette={palette}
              />
            );
          case 'bubble':
            return (
              <BubblePart
                key={index}
                part={part}
                spec={spec}
                fields={template.fields}
                palette={palette}
              />
            );
          case 'icon':
            return <IconPart key={index} part={part} palette={palette} />;
          case 'slot':
            return (
              <TemplateSlotShape
                key={index}
                part={part}
                imageId={template.slots[part.slot] ?? null}
                palette={palette}
                onTap={() => onRequestSlot(part.slot)}
                onReady={onReady}
              />
            );
          default:
            // 파트 종류가 늘어나면 여기서 걸린다. 새 종류는 반드시 위에 한 줄을 더한다.
            return null;
        }
      })}
    </Group>
  );
}
