import { useEffect } from 'react';
import { Group } from 'react-konva';
import TemplateBlurBack from './TemplateBlurBack';
import { CellsPart, LinesPart } from './TemplateHandParts';
import { BubblePart, IconPart, RectPart, RowPart, TextPart } from './TemplateParts';
import TemplateSlotShape from './TemplateSlotShape';
import { fitTemplate } from './templateGeometry';
import { useTemplateFonts, useTemplateTextFonts } from '@/fonts/useTemplateFonts';
import { findTemplate, findVariant } from '@/templates/catalog';
import type { ProjectTemplate } from '@/layers/types';
import type { TemplatePart, TemplateRadius, TemplateSpec } from '@/templates/types';

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
          case 'row':
            return (
              <RowPart
                key={index}
                part={part}
                spec={spec}
                fields={template.fields}
                palette={palette}
              />
            );
          case 'icon':
            return <IconPart key={index} part={part} palette={palette} />;
          case 'lines':
            return <LinesPart key={index} part={part} palette={palette} />;
          case 'cells':
            return (
              <CellsPart
                key={index}
                part={part}
                spec={spec}
                fields={template.fields}
                palette={palette}
              />
            );
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
