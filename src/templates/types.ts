/**
 * 템플릿 스펙.
 *
 * 카드 한 장은 코드가 아니라 데이터다. 새 템플릿을 넣는 일이 "파일 하나를 더 쓰는 일"이어야
 * 기획이 카드를 늘릴 때마다 렌더러를 뜯지 않는다.
 * 같은 파트 목록을 캔버스(Konva)와 패널 썸네일(SVG)이 각자의 방식으로 그린다.
 */

/** 카드 안에서 색을 값이 아니라 역할로 부른다. 변형(화이트/다크)은 팔레트만 갈아 끼워 만든다. */
export type TemplateRole =
  | 'card'
  | 'ink'
  | 'inkMuted'
  | 'accent'
  | 'onAccent'
  | 'slot'
  | 'divider'
  | 'chip'
  | 'onChip';

/**
 * 역할 이름이거나 고정 색이다.
 * 구글 지도의 파랑이나 별의 금색처럼 변형이 바뀌어도 그대로여야 하는 색이 있다.
 * 투명도가 필요하면 8자리 hex를 쓴다(#rrggbbaa).
 */
export type TemplateFill = TemplateRole | `#${string}`;

export type TemplatePalette = Record<TemplateRole, string>;

export interface TemplateVariant {
  id: string;
  label: string;
  palette: TemplatePalette;
  /** 이 슬롯의 사진을 카드 뒤에 흐리게 깐다. 뮤직 카드의 블러 변형이 쓴다. */
  blurSlot?: string;
}

/** Konva의 cornerRadius와 같은 규칙이다. 네 값이면 좌상, 우상, 우하, 좌하 순서다. */
export type TemplateRadius = number | readonly [number, number, number, number];

export interface TemplateRectPart {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: TemplateRadius;
  fill: TemplateFill;
  opacity?: number;
  /** 그림자 반경. 카드 바깥 테두리에만 쓴다. 안쪽 요소까지 걸면 그릴 것이 두 배가 된다. */
  shadow?: number;
}

export interface TemplateTextPart {
  kind: 'text';
  x: number;
  y: number;
  /** 정렬과 줄바꿈의 기준 폭. 없으면 글자 길이만큼만 차지한다. */
  width?: number;
  /** 고정 문구. field가 있으면 그쪽 값이 이긴다. */
  text?: string;
  /** 사용자가 고치는 값의 field id. */
  field?: string;
  size: number;
  weight?: number;
  fill: TemplateFill;
  align?: 'left' | 'center' | 'right';
  /** 앱 폰트 카탈로그의 id. 없으면 카드용 UI 폰트로 그린다. */
  fontId?: string;
  lineHeight?: number;
  /**
   * 여러 줄을 허용할지.
   * 기본은 한 줄로 자른다. 긴 글이 줄바꿈되면 아래에 놓인 요소를 덮어서 카드가 무너진다.
   */
  multiline?: boolean;
}

export interface TemplateSlotPart {
  kind: 'slot';
  slot: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: TemplateRadius;
}

export interface TemplateIconPart {
  kind: 'icon';
  icon: string;
  x: number;
  y: number;
  /** 24 좌표계의 아이콘을 이 크기로 줄여 그린다. */
  size: number;
  fill: TemplateFill;
  /** 채워 그릴지. 별이나 재생 버튼처럼 실루엣이 필요한 것에 쓴다. */
  solid?: boolean;
}

/**
 * 글에 맞춰 늘었다 줄었다 하는 말풍선.
 *
 * 사각형과 글을 따로 적지 않는 이유는, 둘의 크기가 같이 정해져야 하기 때문이다.
 * 메신저 말풍선은 "한 글자면 한 글자만큼"이라 고정 폭으로 그리면 대화로 보이지 않는다.
 */
export interface TemplateBubblePart {
  kind: 'bubble';
  field: string;
  /**
   * 말풍선이 붙는 쪽.
   * left는 x가 왼쪽 끝이고 오른쪽으로 자란다. right는 x가 오른쪽 끝이고 왼쪽으로 자란다.
   */
  side: 'left' | 'right';
  x: number;
  y: number;
  /** 여기까지만 자라고 그 뒤로는 줄을 바꾼다. */
  maxWidth: number;
  size: number;
  weight?: number;
  /** 글자 둘레 여백. 말풍선 크기는 글자 크기에 이 값을 더해 정해진다. */
  padX: number;
  padY: number;
  radius?: TemplateRadius;
  /** 말풍선 색. */
  fill: TemplateFill;
  /** 글자 색. */
  textFill: TemplateFill;
  lineHeight?: number;
  /** 옆에 붙는 시각. 말풍선 길이가 바뀌면 따라 움직인다. */
  time?: string;
  timeFill?: TemplateFill;
  timeSize?: number;
}

export type TemplatePart =
  | TemplateRectPart
  | TemplateTextPart
  | TemplateSlotPart
  | TemplateIconPart
  | TemplateBubblePart;

export interface TemplateField {
  id: string;
  label: string;
  /** 처음 놓일 때의 값. 비워 두면 카드가 빈 채로 나와서 뭘 고쳐야 할지 알 수 없다. */
  value: string;
  /** 입력 상한. 칸을 넘기는 글은 카드 모양을 망가뜨린다. */
  maxLength?: number;
}

export interface TemplateSlot {
  id: string;
  label: string;
}

export interface TemplateSpec {
  id: string;
  label: string;
  /** 설계 좌표계의 크기. 캔버스에 놓일 때 비율에 맞춰 줄인다. */
  width: number;
  height: number;
  fields: readonly TemplateField[];
  slots: readonly TemplateSlot[];
  variants: readonly TemplateVariant[];
  parts: readonly TemplatePart[];
}

/** 고정 색은 항상 #으로 시작한다. 그렇지 않은 것은 팔레트에서 찾을 역할 이름이다. */
function isRole(fill: TemplateFill): fill is TemplateRole {
  return !fill.startsWith('#');
}

export function resolveFill(fill: TemplateFill, palette: TemplatePalette): string {
  return isRole(fill) ? palette[fill] : fill;
}

/**
 * 필드의 현재 값.
 *
 * 레이어를 만들 때 기본값을 전부 복사해 두지만, 스펙에 필드가 나중에 추가될 수 있다.
 * 그때 예전에 만든 레이어가 빈 칸으로 보이지 않도록 스펙의 기본값으로 떨어뜨린다.
 */
export function fieldValue(
  spec: TemplateSpec,
  fields: Readonly<Record<string, string>>,
  id: string,
): string {
  const current = fields[id];
  if (current !== undefined) return current;
  return spec.fields.find((field) => field.id === id)?.value ?? '';
}

/** 파트가 실제로 그릴 문구. 고정 문구와 사용자 값을 한 곳에서 정한다. */
export function partText(
  part: TemplateTextPart,
  spec: TemplateSpec,
  fields: Readonly<Record<string, string>>,
): string {
  return part.field ? fieldValue(spec, fields, part.field) : (part.text ?? '');
}
