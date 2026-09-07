import type { Ratio } from './types';

/**
 * 비율은 화면 크기와 무관한 논리 좌표계의 기준이다.
 * 캔버스 좌표를 픽셀이 아니라 "긴 변 기준 논리 단위"로 잡아야
 * 편집용(축소)과 내보내기용(고해상도) 캔버스가 같은 레이어 좌표를 공유할 수 있다.
 */
export interface RatioSize {
  width: number;
  height: number;
}

/** 논리 캔버스의 긴 변 길이. 내보내기 해상도(2160)와 같은 비례를 쓰면 계산이 단순해진다. */
export const CANVAS_LONG_EDGE = 1080;

const RATIO_VALUES: Record<Ratio, number> = {
  '4:5': 4 / 5,
  '1:1': 1,
  '9:16': 9 / 16,
  '3:4': 3 / 4,
};

export const RATIO_LIST: readonly Ratio[] = ['4:5', '1:1', '9:16', '3:4'];

export const DEFAULT_RATIO: Ratio = '4:5';

/** 비율에 대응하는 논리 캔버스 크기. 세로가 길거나 같은 비율만 다루므로 높이를 긴 변으로 둔다. */
export function getRatioSize(ratio: Ratio): RatioSize {
  const aspect = RATIO_VALUES[ratio];
  if (aspect >= 1) {
    return { width: CANVAS_LONG_EDGE, height: Math.round(CANVAS_LONG_EDGE / aspect) };
  }
  return { width: Math.round(CANVAS_LONG_EDGE * aspect), height: CANVAS_LONG_EDGE };
}

/** 논리 캔버스를 주어진 화면 영역 안에 여백 없이 담기 위한 축소 배율. */
export function getFitScale(ratio: Ratio, viewportWidth: number, viewportHeight: number): number {
  const size = getRatioSize(ratio);
  return Math.min(viewportWidth / size.width, viewportHeight / size.height);
}
