import { layoutText, measureTextWidth, type TextStyle } from './measureText';
import type { TemplateBubblePart } from './types';

/**
 * 말풍선의 자리와 크기 계산.
 *
 * 말풍선은 스펙에 적힌 사각형이 아니라 글에 맞춰 늘었다 줄었다 하는 파트다.
 * 계산을 캔버스와 썸네일이 각자 하면 두 그림의 말풍선이 달라지므로 여기 한 곳에 둔다.
 */

/** 말풍선과 시각 사이 간격(설계 좌표). */
const TIME_GAP = 10;

export interface BubbleLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 글자 블록의 왼쪽 위. */
  textX: number;
  textY: number;
  lines: readonly string[];
  /** 옆에 붙는 시각. 말풍선이 늘면 같이 밀린다. */
  time: { x: number; y: number; text: string; size: number } | null;
}

export function bubbleTextStyle(part: TemplateBubblePart, family: string): TextStyle {
  return { size: part.size, family, weight: part.weight };
}

export function layoutBubble(
  part: TemplateBubblePart,
  text: string,
  family: string,
): BubbleLayout {
  const style = bubbleTextStyle(part, family);
  const lineHeight = part.lineHeight ?? 1.3;

  // 글이 짧으면 그만큼만 차지한다. 이 한 줄이 "말풍선이 글자에 맞는다"의 전부다.
  const block = layoutText(text, style, part.maxWidth - part.padX * 2);
  const width = Math.min(part.maxWidth, block.width + part.padX * 2);
  const height = block.lines.length * part.size * lineHeight + part.padY * 2;

  // 보낸 말은 오른쪽 끝이 고정이고 왼쪽으로 자란다. 받은 말은 그 반대다.
  const x = part.side === 'right' ? part.x - width : part.x;

  const timeSize = part.timeSize ?? 18;
  const timeText = part.time ?? '';
  const timeWidth = timeText ? measureTextWidth(timeText, { size: timeSize, family }) : 0;

  return {
    x,
    y: part.y,
    width,
    height,
    textX: x + part.padX,
    textY: part.y + part.padY,
    lines: block.lines,
    time: timeText
      ? {
          x: part.side === 'right' ? x - TIME_GAP - timeWidth : x + width + TIME_GAP,
          // 시각은 말풍선 아래쪽에 맞춘다. 실제 메신저가 그렇게 보여 준다.
          y: part.y + height - timeSize * 1.2,
          text: timeText,
          size: timeSize,
        }
      : null,
  };
}
