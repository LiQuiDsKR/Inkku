import type { TemplateFill } from './types';

/**
 * 손으로 그린 카드(그림일기)의 파트.
 *
 * 선과 칸의 자리를 여기서 계산하고, 캔버스(Konva)와 패널 썸네일(SVG)은 받은 좌표를 그리기만 한다.
 * 흔들림을 각자 만들면 썸네일과 캔버스의 선 모양이 달라진다.
 */

/** 선분 하나. [x1, y1, x2, y2]. */
export type TemplateSegment = readonly [number, number, number, number];

/** 선분 묶음. 카드의 테두리와 칸막이를 그린다. */
export interface TemplateLinesPart {
  kind: 'lines';
  segments: readonly TemplateSegment[];
  stroke: TemplateFill;
  width: number;
  /**
   * 크레파스로 그은 것처럼 그린다. 살짝 흔들리고, 끝이 조금씩 삐져나가고,
   * 굵기가 다른 선을 여러 번 겹쳐 그어 결이 남는다. 없으면 반듯한 선이다.
   */
  crayon?: boolean;
}

/**
 * 한 칸에 한 글자씩 들어가는 칸.
 * 그림일기와 원고지는 글자마다 칸이 있다. 띄어쓰기도 한 칸을 차지한다.
 */
export interface TemplateCellsPart {
  kind: 'cells';
  field: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  size: number;
  fill: TemplateFill;
  fontId?: string;
}

export interface CrayonStroke {
  points: number[];
  width: number;
  opacity: number;
  /** 결을 내는 끊김. 크레파스는 종이 요철에 걸려 군데군데 비어 보인다. */
  dash?: number[];
}

/** 선분 좌표로 정하는 난수. 같은 선은 언제나 같은 모양으로 흔들려야 다시 그려도 그대로다. */
function seededRandom(segment: TemplateSegment, pass: number): () => number {
  let state =
    (Math.round(segment[0] * 7) * 73856093) ^
    (Math.round(segment[1] * 7) * 19349663) ^
    (Math.round(segment[2] * 7) * 83492791) ^
    (Math.round(segment[3] * 7) * 2654435761) ^
    (pass * 374761393);
  return () => {
    // mulberry32. 짧고 빠르며 이 정도 흔들림에는 충분히 고르다
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CrayonPass {
  /** 선 굵기 대비 이 덧칠의 굵기. */
  width: number;
  opacity: number;
  /** 가운데에서 비켜 긋는 거리(선 굵기 대비). 겹친 선이 조금씩 어긋나야 손으로 그은 티가 난다. */
  offset: number;
  /** 점마다 흔들리는 폭(선 굵기 대비). */
  jitter: number;
  /** 끊어 그릴지. 끊긴 가는 선을 여러 겹 얹으면 그 틈이 크레파스 결처럼 보인다. */
  grain: boolean;
}

/**
 * 크레파스 한 줄을 이루는 덧칠들.
 *
 * Konva의 선은 무늬(패턴)로 칠할 수 없고, 캔버스 흐림 필터는 아이폰에서 안 먹는다.
 * 그래서 결을 그림이 아니라 겹침으로 만든다. 가운데에 옅은 심을 하나 긋고, 그 위에 가는 선을
 * 폭 전체에 흩어 여러 번 끊어 긋는다. 끊긴 자리가 서로 어긋나서 진한 곳과 빈 곳이 생기고,
 * 바깥쪽 선이 들쭉날쭉해서 가장자리가 보풀처럼 일어난다.
 */
const CRAYON_PASSES: readonly CrayonPass[] = [
  { width: 0.72, opacity: 0.7, offset: 0, jitter: 0.06, grain: false },
  { width: 0.34, opacity: 0.75, offset: -0.36, jitter: 0.14, grain: true },
  { width: 0.34, opacity: 0.7, offset: -0.16, jitter: 0.12, grain: true },
  { width: 0.34, opacity: 0.8, offset: 0.04, jitter: 0.12, grain: true },
  { width: 0.34, opacity: 0.7, offset: 0.22, jitter: 0.12, grain: true },
  { width: 0.3, opacity: 0.65, offset: 0.4, jitter: 0.16, grain: true },
];

/** 흔들리는 점 사이 간격. 너무 촘촘하면 떨리는 선이 되고, 너무 넓으면 꺾인 자국이 보인다. */
const STEP = 26;

/** 끊긴 선의 무늬. 칠한 길이와 빈 길이를 번갈아 적는다. 규칙적이면 점선으로 읽혀서 길이를 흩는다. */
function grainDash(random: () => number, width: number): number[] {
  const dash: number[] = [];
  for (let index = 0; index < 10; index += 1) {
    const painted = index % 2 === 0;
    dash.push(width * (painted ? 0.6 + random() * 2.4 : 0.15 + random() * 0.55));
  }
  return dash;
}

/** 선분 하나를 실제로 그을 획들로 바꾼다. */
export function crayonStrokes(segment: TemplateSegment, width: number, crayon = true): CrayonStroke[] {
  const [x1, y1, x2, y2] = segment;
  if (!crayon) return [{ points: [x1, y1, x2, y2], width, opacity: 1 }];

  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length === 0) return [];
  const ux = (x2 - x1) / length;
  const uy = (y2 - y1) / length;
  // 선에 수직인 방향. 흔들림과 비켜 긋기는 이쪽으로만 한다
  const nx = -uy;
  const ny = ux;
  // 한 줄은 한 번에 긋는 손놀림이라 휘는 방향이 덧칠마다 같아야 한다. 따로 휘면 선이 갈라져 보인다
  const bow = (seededRandom(segment, 99)() - 0.5) * width * 0.6;

  return CRAYON_PASSES.map((pass, index) => {
    const random = seededRandom(segment, index);
    // 끝이 칸 모서리에 딱 맞으면 자로 그은 것처럼 보인다. 조금 모자라거나 조금 삐져나가게 둔다
    const startOver = (random() - 0.35) * width * 0.9;
    const endOver = (random() - 0.35) * width * 0.9;
    const total = length + startOver + endOver;
    const count = Math.max(2, Math.ceil(total / STEP) + 1);

    const points: number[] = [];
    for (let step = 0; step < count; step += 1) {
      const t = step / (count - 1);
      const along = -startOver + total * t;
      // 한쪽으로 살짝 휘는 활 모양. 손목으로 긋는 긴 선은 가운데가 조금 부푼다
      const side =
        pass.offset * width + Math.sin(Math.PI * t) * bow + (random() - 0.5) * 2 * pass.jitter * width;
      points.push(x1 + ux * along + nx * side, y1 + uy * along + ny * side);
    }

    return {
      points,
      width: width * pass.width,
      opacity: pass.opacity,
      dash: pass.grain ? grainDash(random, width) : undefined,
    };
  });
}

export interface CellGlyph {
  char: string;
  /** 칸의 가운데. 글자를 이 점에 맞춰 그린다. */
  cx: number;
  cy: number;
}

/**
 * 글을 칸에 한 글자씩 놓는다.
 * 띄어쓰기는 칸만 차지하고 그리지 않는다. 줄바꿈은 다음 줄 첫 칸으로 간다. 칸이 모자라면 거기서 끊는다.
 */
export function layoutCells(part: TemplateCellsPart, text: string): CellGlyph[] {
  const cellWidth = part.width / part.columns;
  const cellHeight = part.height / part.rows;
  const glyphs: CellGlyph[] = [];
  let column = 0;
  let row = 0;

  // Array.from으로 나눠야 서로게이트 쌍으로 된 문자가 반으로 쪼개져 두 칸을 먹지 않는다
  for (const char of Array.from(text)) {
    if (char === '\n') {
      row += 1;
      column = 0;
      continue;
    }
    if (row >= part.rows) break;
    if (char.trim().length > 0) {
      glyphs.push({
        char,
        cx: part.x + cellWidth * (column + 0.5),
        cy: part.y + cellHeight * (row + 0.5),
      });
    }
    column += 1;
    if (column >= part.columns) {
      column = 0;
      row += 1;
    }
  }
  return glyphs;
}

/**
 * 칸막이 선분. 바깥 테두리는 넣지 않는다. 카드 테두리와 겹쳐 두 번 그어지면 그 줄만 진해진다.
 */
export function gridSegments(
  x: number,
  y: number,
  width: number,
  height: number,
  columns: number,
  rows: number,
): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  for (let column = 1; column < columns; column += 1) {
    const at = x + (width / columns) * column;
    segments.push([at, y, at, y + height]);
  }
  for (let row = 1; row < rows; row += 1) {
    const at = y + (height / rows) * row;
    segments.push([x, at, x + width, at]);
  }
  return segments;
}
