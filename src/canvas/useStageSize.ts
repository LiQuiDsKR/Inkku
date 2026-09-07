import { useEffect, useState, type RefObject } from 'react';
import { getRatioSize } from '@/layers/ratio';
import type { Ratio } from '@/layers/types';

/** 캔버스가 화면 가장자리에 딱 붙으면 회전 핸들을 잡기 어렵다. 최소한의 여백을 둔다. */
const EDGE_PADDING = 16;

export interface StageSize {
  /** 레이어 좌표가 사는 논리 캔버스 크기. 화면 크기와 무관하다. */
  logicalWidth: number;
  logicalHeight: number;
  /** 화면에 실제로 그려지는 픽셀 크기. */
  width: number;
  height: number;
  /** 논리 좌표를 화면 좌표로 바꾸는 배율. */
  scale: number;
}

/**
 * 컨테이너 크기에 맞춰 스테이지 배율을 계산한다.
 * 주소창이 나타나고 사라지면서 높이가 바뀌므로 한 번 재는 걸로는 부족하고,
 * ResizeObserver로 계속 따라가야 한다.
 */
export function useStageSize(
  containerRef: RefObject<HTMLElement | null>,
  ratio: Ratio,
): StageSize | null {
  const [size, setSize] = useState<StageSize | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const available = element.getBoundingClientRect();
      const logical = getRatioSize(ratio);
      const usableWidth = Math.max(1, available.width - EDGE_PADDING * 2);
      const usableHeight = Math.max(1, available.height - EDGE_PADDING * 2);
      const scale = Math.min(usableWidth / logical.width, usableHeight / logical.height);

      setSize({
        logicalWidth: logical.width,
        logicalHeight: logical.height,
        width: logical.width * scale,
        height: logical.height * scale,
        scale,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, ratio]);

  return size;
}
