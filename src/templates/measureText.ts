/**
 * 카드 글자의 폭을 재는 계산.
 *
 * 말풍선처럼 "글에 맞춰 크기가 정해지는" 파트는 그리기 전에 글자 폭을 알아야 한다.
 * 캔버스(Konva)와 패널 썸네일(SVG)이 각자 재면 두 그림의 말풍선 길이가 달라지므로
 * 재는 곳을 여기 하나로 둔다.
 *
 * 브라우저의 2D 컨텍스트를 쓴다. 폰트가 아직 안 왔으면 폴백 폰트로 재지만,
 * 폰트가 도착하면 카드가 통째로 다시 그려지면서 다시 재기 때문에 결국 맞는 값이 된다.
 */

let context: CanvasRenderingContext2D | null = null;

function measureContext(): CanvasRenderingContext2D | null {
  if (context) return context;
  // 화면에 붙이지 않는다. 재는 데만 쓰므로 1x1이면 충분하다.
  context = document.createElement('canvas').getContext('2d');
  return context;
}

export interface TextStyle {
  size: number;
  family: string;
  weight?: number;
}

/**
 * 캔버스 font 문자열. 문구 스티커는 잴 때와 그릴 때 이 문자열을 같이 쓴다.
 * 굵기 하나만 달라도 폭이 달라져서 배경 도형이 글자보다 짧아진다.
 */
export function fontSpec(style: TextStyle): string {
  return `${style.weight ?? 400} ${style.size}px ${style.family}`;
}

/** 한 줄의 폭. 컨텍스트를 못 얻으면 글자 수로 어림잡는다(없는 것보다는 낫다). */
export function measureTextWidth(text: string, style: TextStyle): number {
  const ctx = measureContext();
  if (!ctx) return text.length * style.size * 0.55;
  ctx.font = fontSpec(style);
  return ctx.measureText(text).width;
}

/** 말줄임에 쓰는 꼬리. 세 점을 한 글자로 쓰면 폭 계산이 글꼴마다 달라진다. */
const ELLIPSIS = '...';

/**
 * 폭 안에 들어가도록 뒤를 자르고 말줄임을 붙인다.
 *
 * 한 줄로 두는 항목이 길어졌을 때 쓴다. 자르지 않으면 옆 항목을 밀어내다가
 * 결국 카드 밖으로 나간다. 한 글자씩 줄이는 이유는 한글과 영문의 폭이 달라서
 * 글자 수로 어림하면 맞지 않기 때문이다.
 */
export function ellipsize(text: string, style: TextStyle, maxWidth: number): string {
  if (measureTextWidth(text, style) <= maxWidth) return text;

  const chars = [...text];
  while (chars.length > 0) {
    chars.pop();
    const candidate = `${chars.join('').trimEnd()}${ELLIPSIS}`;
    if (measureTextWidth(candidate, style) <= maxWidth) return candidate;
  }

  return ELLIPSIS;
}

/**
 * 폭 안에 들어가도록 줄을 나눈다.
 *
 * 띄어쓰기를 먼저 본다. 한 낱말이 그 자체로 폭을 넘으면(한글은 띄어쓰기 없이 길게 쓰기도 한다)
 * 글자 단위로 끊는다. Konva의 자동 줄바꿈에 맡기지 않는 이유는, 그러면 줄 수를 알 수 없어서
 * 말풍선 높이를 정할 수 없기 때문이다.
 */
export function wrapText(text: string, style: TextStyle, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    let line = '';

    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (measureTextWidth(candidate, style) <= maxWidth || !line) {
        // 낱말 하나가 폭을 넘으면 글자 단위로 끊는다
        if (measureTextWidth(candidate, style) > maxWidth && !line) {
          let chunk = '';
          for (const char of candidate) {
            if (chunk && measureTextWidth(chunk + char, style) > maxWidth) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          line = chunk;
          continue;
        }
        line = candidate;
        continue;
      }
      lines.push(line);
      line = word;
    }

    lines.push(line);
  }

  return lines;
}

export interface TextBlock {
  lines: readonly string[];
  /** 가장 긴 줄의 폭. */
  width: number;
}

/** 줄 나누기와 폭 재기를 한 번에. 말풍선은 이 값으로 자기 크기를 정한다. */
export function layoutText(text: string, style: TextStyle, maxWidth: number): TextBlock {
  const lines = wrapText(text, style, maxWidth);
  const width = lines.reduce((max, line) => Math.max(max, measureTextWidth(line, style)), 0);
  return { lines, width };
}
