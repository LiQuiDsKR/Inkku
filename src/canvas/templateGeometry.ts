import type Konva from 'konva';
import type { TemplateRadius, TemplateSpec } from '@/templates/types';

/**
 * 템플릿 스펙의 값을 Konva가 받는 형태로 옮기는 계산.
 * 캔버스 쪽에만 필요한 변환이라 스펙(데이터)에도, 패널(UI)에도 두지 않는다.
 */

/**
 * 카드가 캔버스에서 차지하는 비율.
 * 꽉 채우지 않는 이유는 카드 그림자가 잘리면 종이가 아니라 벽지처럼 보이기 때문이다.
 */
const CARD_FILL = 0.95;

export interface TemplateFit {
  x: number;
  y: number;
  scale: number;
}

/**
 * 카드가 놓일 자리와 크기.
 *
 * 카드는 요소가 아니라 배경과 같은 층위라, 손으로 옮기고 키우는 대신 캔버스에 맞춰 놓인다.
 * 다만 스펙의 비율은 그대로 지킨다. 캔버스 비율(4:5 등)에 맞춰 늘리면 카드가 찌그러진다.
 * 남는 자리는 배경이 채운다.
 */
export function fitTemplate(
  spec: TemplateSpec,
  canvasWidth: number,
  canvasHeight: number,
): TemplateFit {
  const scale = Math.min(
    (canvasWidth * CARD_FILL) / spec.width,
    (canvasHeight * CARD_FILL) / spec.height,
  );

  return {
    x: (canvasWidth - spec.width * scale) / 2,
    y: (canvasHeight - spec.height * scale) / 2,
    scale,
  };
}

/**
 * 스펙의 모서리 값을 Konva의 cornerRadius로 바꾼다.
 * 스펙은 읽기 전용 튜플이라 그대로 넘기면 타입이 맞지 않는다. 복사해서 준다.
 */
export function cornerRadius(radius?: TemplateRadius): number | number[] | undefined {
  if (radius === undefined) return undefined;
  return typeof radius === 'number' ? radius : [...radius];
}

/** 네 모서리 중 가장 큰 값. 클리핑 경로처럼 한 값만 받는 곳에 쓴다. */
function maxRadius(radius?: TemplateRadius): number {
  if (radius === undefined) return 0;
  return typeof radius === 'number' ? radius : Math.max(...radius);
}

/**
 * 둥근 사각형 클리핑 경로.
 *
 * Konva의 Context에는 roundRect가 없어서 arcTo 네 번으로 직접 그린다.
 * 블러로 깐 사진을 카드 모양으로 잘라 내는 데 쓴다. 자르지 않으면 네모난 사진이
 * 둥근 카드 뒤로 삐져나와 카드가 아니라 사진 위에 얹은 판처럼 보인다.
 */
export function roundedClip(
  width: number,
  height: number,
  radius?: TemplateRadius,
): (ctx: Konva.Context) => void {
  const r = Math.min(maxRadius(radius), width / 2, height / 2);

  return (ctx) => {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(width, 0, width, height, r);
    ctx.arcTo(width, height, 0, height, r);
    ctx.arcTo(0, height, 0, 0, r);
    ctx.arcTo(0, 0, width, 0, r);
    ctx.closePath();
  };
}
