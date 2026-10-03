import { gridSegments, type TemplateSegment } from './handParts';
import type { TemplatePalette, TemplateSpec } from './types';

/**
 * 그림일기 한 장. 초등학생 그림일기장처럼 위에 날짜와 날씨, 가운데 그림, 아래 글자 칸이 있다.
 *
 * 선은 전부 크레파스로 그은 것처럼 흔들린다(`handParts.ts`). 글씨는 아이들 손글씨로 만든 서체다.
 * 글은 한 칸에 한 글자씩 들어간다. 띄어쓰기도 한 칸이라 원고지처럼 보인다.
 */

const WIDTH = 600;
const HEIGHT = 900;

/** 바깥 테두리의 자리. 종이 끝에서 이만큼 들어와 그은 선이다. */
const INSET = 24;
const LEFT = INSET;
const RIGHT = WIDTH - INSET;
const TOP = INSET;
const BOTTOM = HEIGHT - INSET;
const INNER_WIDTH = RIGHT - LEFT;

/** 날짜 줄의 아랫선. */
const HEADER_BOTTOM = 100;
/** 날짜와 날씨를 나누는 세로선. */
const WEATHER_X = 412;

/** 글자 칸. 7칸 6줄은 그림일기장에서 흔한 크기다. 칸은 가로가 조금 넓다. */
const COLUMNS = 7;
const ROWS = 6;
const CELL_HEIGHT = 63;
const GRID_TOP = BOTTOM - CELL_HEIGHT * ROWS;

/** 크레파스 선 굵기. 사진 위로 지나가는 선도 이 굵기라 그림 가장자리를 덮는다. */
const LINE = 8;

const BORDER: TemplateSegment[] = [
  [LEFT, TOP, RIGHT, TOP],
  [RIGHT, TOP, RIGHT, BOTTOM],
  [RIGHT, BOTTOM, LEFT, BOTTOM],
  [LEFT, BOTTOM, LEFT, TOP],
  [LEFT, HEADER_BOTTOM, RIGHT, HEADER_BOTTOM],
  [WEATHER_X, TOP, WEATHER_X, HEADER_BOTTOM],
  [LEFT, GRID_TOP, RIGHT, GRID_TOP],
];

/** 손글씨 서체. 날짜 줄과 글자 칸이 같이 쓴다. */
const HAND_FONT = 'yoon-child';
const HEADER_SIZE = 28;
/** 날짜 줄 글자의 윗선. 줄 높이(글자 크기의 1.2배)를 날짜 칸 가운데에 둔다. */
const HEADER_Y = TOP + (HEADER_BOTTOM - TOP - HEADER_SIZE * 1.2) / 2;
/** 숫자와 단위("10" "월") 사이는 붙이고, 단위 뒤의 다음 숫자 앞은 띄운다. */
const UNIT_GAP = 3;
const VALUE_GAP = 14;

function paper(card: string, ink: string, muted: string, slot: string): TemplatePalette {
  return {
    card,
    ink,
    inkMuted: muted,
    accent: ink,
    onAccent: card,
    slot,
    divider: muted,
    chip: slot,
    onChip: ink,
  };
}

export const DIARY_TEMPLATE: TemplateSpec = {
  id: 'diary',
  label: '그림일기',
  width: WIDTH,
  height: HEIGHT,

  fields: [
    { id: 'year', label: '연도', value: '2026', maxLength: 4 },
    { id: 'month', label: '월', value: '10', maxLength: 2 },
    { id: 'day', label: '일', value: '4', maxLength: 2 },
    { id: 'weekday', label: '요일', value: '일', maxLength: 1 },
    { id: 'weather', label: '날씨', value: '맑음', maxLength: 6 },
    {
      id: 'body',
      label: '내용',
      value: '오늘은 친구랑 공원에 갔다. 하늘이 맑아서 기분이 좋았다.',
      // 칸 수만큼만 받는다. 넘친 글은 그릴 칸이 없어 잘린다
      maxLength: COLUMNS * ROWS,
    },
  ],

  slots: [{ id: 'picture', label: '그림' }],

  variants: [
    { id: 'white', label: '흰 종이', palette: paper('#ffffff', '#1f1f22', '#8c8c92', '#efeff2') },
    { id: 'kraft', label: '누런 종이', palette: paper('#f3ead5', '#3b2f23', '#9d8f77', '#e6dbc2') },
    { id: 'blue', label: '파랑 크레파스', palette: paper('#fbfdff', '#2f5db0', '#93a9d1', '#e8f0fb') },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: WIDTH, height: HEIGHT, radius: 6, fill: 'card', shadow: 22 },
    // 그림 자리는 테두리 선 안쪽을 꽉 채운다. 선을 나중에 그어서 사진 가장자리 위로 크레파스가 지나간다
    {
      kind: 'slot',
      slot: 'picture',
      x: LEFT,
      y: HEADER_BOTTOM,
      width: INNER_WIDTH,
      height: GRID_TOP - HEADER_BOTTOM,
    },
    {
      kind: 'row',
      x: LEFT + 20,
      y: HEADER_Y,
      gap: UNIT_GAP,
      maxWidth: WEATHER_X - LEFT - 34,
      items: [
        { kind: 'text', field: 'year', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
        { kind: 'text', text: '년', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
        { kind: 'text', field: 'month', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT, gap: VALUE_GAP },
        { kind: 'text', text: '월', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
        { kind: 'text', field: 'day', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT, gap: VALUE_GAP },
        { kind: 'text', text: '일', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
        { kind: 'text', field: 'weekday', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT, gap: VALUE_GAP },
        { kind: 'text', text: '요일', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
      ],
    },
    {
      kind: 'row',
      x: WEATHER_X + 16,
      y: HEADER_Y,
      gap: 8,
      maxWidth: RIGHT - WEATHER_X - 28,
      items: [
        { kind: 'text', text: '날씨:', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
        { kind: 'text', field: 'weather', size: HEADER_SIZE, fill: 'ink', fontId: HAND_FONT },
      ],
    },
    {
      kind: 'cells',
      field: 'body',
      x: LEFT,
      y: GRID_TOP,
      width: INNER_WIDTH,
      height: CELL_HEIGHT * ROWS,
      columns: COLUMNS,
      rows: ROWS,
      size: 42,
      fill: 'ink',
      fontId: HAND_FONT,
    },
    // 칸막이를 먼저, 테두리를 나중에 긋는다. 굵은 바깥선이 칸막이 끝을 덮어야 끝이 깔끔하다
    {
      kind: 'lines',
      segments: gridSegments(LEFT, GRID_TOP, INNER_WIDTH, CELL_HEIGHT * ROWS, COLUMNS, ROWS),
      stroke: 'ink',
      width: LINE * 0.8,
      crayon: true,
    },
    { kind: 'lines', segments: BORDER, stroke: 'ink', width: LINE, crayon: true },
  ],
};
