import { findFont } from '@/fonts/catalog';
import { CARD_FONT_FAMILY } from '@/fonts/useTemplateFonts';
import { layoutBubble } from '@/templates/bubble';
import { findVariant } from '@/templates/catalog';
import { findIconPath } from '@/templates/icons';
import { layoutRow } from '@/templates/row';
import { resolveFill } from '@/templates/types';
import type {
  TemplatePalette,
  TemplatePart,
  TemplateRadius,
  TemplateSpec,
} from '@/templates/types';

/** SVG의 rx는 모서리마다 다른 값을 못 준다. 미리보기에서는 가장 큰 값 하나로 둥글린다. */
function previewRadius(radius?: TemplateRadius): number | undefined {
  if (radius === undefined) return undefined;
  return typeof radius === 'number' ? radius : Math.max(...radius);
}

interface TemplatePreviewProps {
  spec: TemplateSpec;
  variantId: string;
  className?: string;
}

/**
 * 패널에 띄우는 카드 썸네일.
 *
 * 캔버스 렌더러와 같은 파트 목록을 SVG로 그린다. 그림을 따로 그려 두지 않는 이유는,
 * 카드 디자인을 고쳤을 때 목록의 그림만 옛날 것으로 남는 일을 막기 위해서다.
 * 고를 때 보이는 것과 넣었을 때 나오는 것이 같아야 고르는 의미가 있다.
 */
export default function TemplatePreview({ spec, variantId, className }: TemplatePreviewProps) {
  const variant = findVariant(spec, variantId);
  if (!variant) return null;

  return (
    <svg
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {spec.parts.map((part, index) => (
        <PreviewPart key={index} part={part} spec={spec} palette={variant.palette} />
      ))}
    </svg>
  );
}

interface PreviewPartProps {
  part: TemplatePart;
  spec: TemplateSpec;
  palette: TemplatePalette;
}

function PreviewPart({ part, spec, palette }: PreviewPartProps) {
  switch (part.kind) {
    case 'rect':
      return (
        <rect
          x={part.x}
          y={part.y}
          width={part.width}
          height={part.height}
          rx={previewRadius(part.radius)}
          fill={resolveFill(part.fill, palette)}
          opacity={part.opacity}
        />
      );

    case 'text': {
      const width = part.width ?? 0;
      const center = part.align === 'center';
      const right = part.align === 'right';
      return (
        <text
          // SVG의 y는 글자의 밑선이고 캔버스의 y는 윗선이다. 크기의 0.82만큼 내려야 눈높이가 맞는다
          x={center ? part.x + width / 2 : right ? part.x + width : part.x}
          y={part.y + part.size * 0.82}
          textAnchor={center ? 'middle' : right ? 'end' : 'start'}
          fontSize={part.size}
          fontWeight={part.weight ?? 400}
          fontFamily={part.fontId ? findFont(part.fontId).family : undefined}
          fill={resolveFill(part.fill, palette)}
        >
          {part.field
            ? (spec.fields.find((field) => field.id === part.field)?.value ?? '')
            : (part.text ?? '')}
        </text>
      );
    }

    case 'bubble': {
      // 캔버스와 같은 계산을 쓴다. 썸네일의 말풍선만 다른 길이로 나오면 고르는 의미가 없다
      const text = spec.fields.find((field) => field.id === part.field)?.value ?? '';
      const layout = layoutBubble(part, text, CARD_FONT_FAMILY);
      const lineHeight = part.lineHeight ?? 1.3;

      return (
        <g>
          <rect
            x={layout.x}
            y={layout.y}
            width={layout.width}
            height={layout.height}
            rx={previewRadius(part.radius)}
            fill={resolveFill(part.fill, palette)}
          />
          <text
            x={layout.textX}
            y={layout.textY}
            fontSize={part.size}
            fontWeight={part.weight ?? 400}
            fontFamily={CARD_FONT_FAMILY}
            fill={resolveFill(part.textFill, palette)}
          >
            {layout.lines.map((line, index) => (
              <tspan
                key={index}
                x={layout.textX}
                // SVG의 y는 밑선이다. 첫 줄만 글자 높이만큼 내리고 다음 줄은 줄간격만큼 내린다
                dy={index === 0 ? part.size * 0.82 : part.size * lineHeight}
              >
                {line}
              </tspan>
            ))}
          </text>
          {layout.time && (
            <text
              x={layout.time.x}
              y={layout.time.y + layout.time.size * 0.82}
              fontSize={layout.time.size}
              fontFamily={CARD_FONT_FAMILY}
              fill={resolveFill(part.timeFill ?? 'inkMuted', palette)}
            >
              {layout.time.text}
            </text>
          )}
        </g>
      );
    }

    case 'slot':
      return (
        <g>
          <rect
            x={part.x}
            y={part.y}
            width={part.width}
            height={part.height}
            rx={previewRadius(part.radius)}
            fill={resolveFill('slot', palette)}
          />
          {/* 사진이 들어갈 자리라는 표시. 캔버스와 같은 더하기 모양이라 보고 바로 알아본다 */}
          <PlusMark part={part} />
        </g>
      );

    case 'icon':
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

    case 'row': {
      // 캔버스와 같은 계산을 쓴다. 썸네일만 다른 자리에 그리면 고르는 의미가 없다
      const layout = layoutRow(part, spec, {}, (fontId) =>
        fontId ? findFont(fontId).family : CARD_FONT_FAMILY,
      );

      return (
        <g>
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
              <text
                key={index}
                x={box.x}
                // SVG의 y는 글자의 밑선이고 캔버스의 y는 윗선이다. 크기의 0.82만큼 내려야 눈높이가 맞는다
                y={box.y + box.item.size * 0.82}
                fontSize={box.item.size}
                fontWeight={box.item.weight ?? 400}
                fontFamily={box.item.fontId ? findFont(box.item.fontId).family : CARD_FONT_FAMILY}
                fill={resolveFill(box.item.fill, palette)}
              >
                {box.text}
              </text>
            ),
          )}
        </g>
      );
    }

    default:
      return null;
  }
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
  if (!path) return null;

  return (
    <path
      d={path}
      transform={`translate(${x} ${y}) scale(${size / 24})`}
      fill={solid ? color : 'none'}
      stroke={solid ? 'none' : color}
      strokeWidth={solid ? 0 : 2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function PlusMark({ part }: { part: { x: number; y: number; width: number; height: number } }) {
  const size = Math.min(72, Math.min(part.width, part.height) * 0.44);
  const x = part.x + part.width / 2;
  const y = part.y + part.height / 2;
  const arm = size * 0.31;

  return (
    <g>
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        rx={size * 0.28}
        fill="#ffffff"
        stroke="#16181d"
        strokeWidth={size * 0.055}
      />
      <path
        d={`M${x} ${y - arm}V${y + arm}M${x - arm} ${y}H${x + arm}`}
        stroke="#16181d"
        strokeWidth={size * 0.062}
        strokeLinecap="round"
      />
    </g>
  );
}
