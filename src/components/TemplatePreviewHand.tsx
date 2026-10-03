import { findFont } from '@/fonts/catalog';
import { CARD_FONT_FAMILY } from '@/fonts/useTemplateFonts';
import { crayonStrokes, layoutCells } from '@/templates/handParts';
import { resolveFill } from '@/templates/types';
import type { TemplateCellsPart, TemplateLinesPart } from '@/templates/handParts';
import type { TemplatePalette, TemplateSpec } from '@/templates/types';

/**
 * 손으로 그린 카드의 썸네일(SVG). 캔버스(`TemplateHandParts`)와 같은 계산을 써서
 * 썸네일의 선 흔들림과 글자 자리가 넣었을 때와 같다.
 */

function toPolyline(points: readonly number[]): string {
  const pairs: string[] = [];
  for (let index = 0; index + 1 < points.length; index += 2) {
    pairs.push(`${points[index]},${points[index + 1]}`);
  }
  return pairs.join(' ');
}

export function LinesPreview({ part, palette }: { part: TemplateLinesPart; palette: TemplatePalette }) {
  const color = resolveFill(part.stroke, palette);
  return (
    <g>
      {part.segments.flatMap((segment, index) =>
        crayonStrokes(segment, part.width, part.crayon).map((stroke, pass) => (
          <polyline
            key={`${index}-${pass}`}
            points={toPolyline(stroke.points)}
            fill="none"
            stroke={color}
            strokeWidth={stroke.width}
            strokeOpacity={stroke.opacity}
            strokeDasharray={stroke.dash?.join(' ')}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )),
      )}
    </g>
  );
}

interface CellsPreviewProps {
  part: TemplateCellsPart;
  spec: TemplateSpec;
  palette: TemplatePalette;
}

export function CellsPreview({ part, spec, palette }: CellsPreviewProps) {
  // 썸네일은 고른 값이 아니라 스펙의 견본 문구로 그린다. 다른 파트의 썸네일과 같은 약속이다
  const text = spec.fields.find((field) => field.id === part.field)?.value ?? '';
  const color = resolveFill(part.fill, palette);
  const family = part.fontId ? findFont(part.fontId).family : CARD_FONT_FAMILY;

  return (
    <g>
      {layoutCells(part, text).map((glyph, index) => (
        <text
          key={index}
          x={glyph.cx}
          y={glyph.cy}
          textAnchor="middle"
          // 캔버스는 줄 상자의 가운데에 글자를 세운다. SVG에서는 central이 그 자리다
          dominantBaseline="central"
          fontSize={part.size}
          fontFamily={family}
          fill={color}
        >
          {glyph.char}
        </text>
      ))}
    </g>
  );
}
