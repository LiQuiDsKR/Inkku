import { Fragment } from 'react';
import { Line, Text } from 'react-konva';
import { findFont } from '@/fonts/catalog';
import { CARD_FONT_FAMILY } from '@/fonts/useTemplateFonts';
import { crayonStrokes, layoutCells } from '@/templates/handParts';
import { fieldValue, resolveFill } from '@/templates/types';
import type { TemplateCellsPart, TemplateLinesPart } from '@/templates/handParts';
import type { TemplatePalette, TemplateSpec } from '@/templates/types';

/**
 * 손으로 그린 카드의 파트(Konva). 흔들림과 칸 자리는 `templates/handParts.ts`가 정하고
 * 여기서는 받은 좌표를 그리기만 한다. 썸네일(SVG)도 같은 계산을 쓴다.
 */

export function LinesPart({ part, palette }: { part: TemplateLinesPart; palette: TemplatePalette }) {
  const color = resolveFill(part.stroke, palette);
  return (
    <>
      {part.segments.map((segment, index) => (
        <Fragment key={index}>
          {crayonStrokes(segment, part.width, part.crayon).map((stroke, pass) => (
            <Line
              key={pass}
              points={stroke.points}
              stroke={color}
              strokeWidth={stroke.width}
              opacity={stroke.opacity}
              dash={stroke.dash}
              lineCap="round"
              lineJoin="round"
              // 카드의 선은 배경과 같다. 눌러도 잡히는 것이 없어야 빈 곳을 누른 것처럼 선택이 풀린다
              listening={false}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
}

interface CellsPartProps {
  part: TemplateCellsPart;
  spec: TemplateSpec;
  fields: Readonly<Record<string, string>>;
  palette: TemplatePalette;
}

/** 칸마다 글자 하나. 글자를 칸 가운데에 세운다. */
export function CellsPart({ part, spec, fields, palette }: CellsPartProps) {
  const glyphs = layoutCells(part, fieldValue(spec, fields, part.field));
  const cellWidth = part.width / part.columns;
  const cellHeight = part.height / part.rows;
  const family = part.fontId ? findFont(part.fontId).family : CARD_FONT_FAMILY;
  const color = resolveFill(part.fill, palette);

  return (
    <>
      {glyphs.map((glyph, index) => (
        <Text
          key={index}
          x={glyph.cx - cellWidth / 2}
          y={glyph.cy - cellHeight / 2}
          width={cellWidth}
          height={cellHeight}
          text={glyph.char}
          fontSize={part.size}
          fontFamily={family}
          fill={color}
          align="center"
          verticalAlign="middle"
          wrap="none"
          listening={false}
        />
      ))}
    </>
  );
}
