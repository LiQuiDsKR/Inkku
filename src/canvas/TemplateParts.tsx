import { Path, Rect, Text } from 'react-konva';
import { cornerRadius } from './templateGeometry';
import { findFont } from '@/fonts/catalog';
import { CARD_FONT_FAMILY } from '@/fonts/useTemplateFonts';
import { layoutBubble } from '@/templates/bubble';
import { findIconPath } from '@/templates/icons';
import { layoutRow } from '@/templates/row';
import { fieldValue, partText, resolveFill } from '@/templates/types';
import type {
  TemplateBubblePart,
  TemplateIconPart,
  TemplatePalette,
  TemplateRectPart,
  TemplateRowPart,
  TemplateSpec,
  TemplateTextPart,
} from '@/templates/types';

/**
 * 템플릿 카드의 파트별 그리기(Konva).
 *
 * 카드 렌더러(`TemplateContent`)는 파트 종류를 보고 여기로 넘기기만 한다.
 * 파트가 늘 때마다 렌더러 한 파일이 커지지 않게 그리는 쪽을 따로 모았다.
 */

/** 카드가 배경에서 떠 보이게 하는 그림자. 값이 고정이라 필터와 달리 캐시가 필요 없다. */
const SHADOW_COLOR = 'rgba(0,0,0,0.38)';

/** 선으로 그리는 아이콘의 두께(24 좌표계 기준). 카드가 커져도 선 굵기의 인상은 같아야 한다. */
const ICON_STROKE = 2.1;

export function RectPart({ part, palette }: { part: TemplateRectPart; palette: TemplatePalette }) {
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

export function TextPart({ part, spec, fields, palette }: TextPartProps) {
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
export function BubblePart({ part, spec, fields, palette }: BubblePartProps) {
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

interface IconGlyphProps {
  icon: string;
  x: number;
  y: number;
  size: number;
  color: string;
  solid?: boolean;
}

/** 아이콘 하나. 좌표가 스펙에서 오든 줄 계산에서 오든 그리는 방법은 같다. */
function IconGlyph({ icon, x, y, size, color, solid }: IconGlyphProps) {
  const path = findIconPath(icon);
  // 스펙의 오타 하나로 카드 전체가 죽지 않게 한다
  if (!path) return null;

  const scale = size / 24;

  return (
    <Path
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      data={path}
      fill={solid ? color : undefined}
      stroke={solid ? undefined : color}
      strokeWidth={solid ? 0 : ICON_STROKE}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  );
}

export function IconPart({ part, palette }: { part: TemplateIconPart; palette: TemplatePalette }) {
  return (
    <IconGlyph
      icon={part.icon}
      x={part.x}
      y={part.y}
      size={part.size}
      color={resolveFill(part.fill, palette)}
      solid={part.solid}
    />
  );
}

interface RowPartProps {
  part: TemplateRowPart;
  spec: TemplateSpec;
  fields: Readonly<Record<string, string>>;
  palette: TemplatePalette;
}

/**
 * 가로로 이어 붙는 한 줄.
 *
 * 자리를 스펙이 아니라 글자 폭에서 구한다. 앞 글이 길어지면 뒤가 밀려나므로
 * 사용자가 무엇을 적어 넣어도 두 글이 겹치지 않는다.
 */
export function RowPart({ part, spec, fields, palette }: RowPartProps) {
  const layout = layoutRow(part, spec, fields, (fontId) =>
    fontId ? findFont(fontId).family : CARD_FONT_FAMILY,
  );

  return (
    <>
      {layout.items.map((box, index) =>
        box.item.kind === 'icon' ? (
          <IconGlyph
            key={index}
            icon={box.item.icon}
            x={box.x}
            y={box.y}
            size={box.item.size}
            color={resolveFill(box.item.fill, palette)}
            solid={box.item.solid}
          />
        ) : (
          <Text
            key={index}
            x={box.x}
            y={box.y}
            text={box.text}
            fontSize={box.item.size}
            fontStyle={box.item.weight ? String(box.item.weight) : undefined}
            fontFamily={box.item.fontId ? findFont(box.item.fontId).family : CARD_FONT_FAMILY}
            fill={resolveFill(box.item.fill, palette)}
            lineHeight={1.2}
            wrap="none"
            listening={false}
          />
        ),
      )}
    </>
  );
}
