import type { PhotoLayer } from './types';

/**
 * 사진 프레임.
 *
 * 여백을 가진 것(종이 위에 사진을 올린 것)과 사진 위에 얹는 것(선, 테이프)을 한 목록에 둔다.
 * 쓰는 사람에게는 둘 다 "테두리를 고르는 일" 하나이기 때문이다.
 *
 * 값은 전부 사진 짧은 변에 대한 비율이다. 고정 픽셀로 두면 작은 사진에서는 테두리가
 * 사진을 잡아먹고 큰 사진에서는 실선처럼 얇아진다.
 */

export type FrameStyle =
  | 'none'
  | 'plain'
  | 'polaroid'
  | 'round'
  | 'vintage'
  | 'film'
  | 'gold'
  | 'dashed'
  | 'tape';

export interface FramePreset {
  style: FrameStyle;
  label: string;
  /** 종이 색. 없으면 종이를 깔지 않고 사진 위에 바로 그린다. */
  paper?: string;
  /** 종이 여백. */
  pad: number;
  /** 아래쪽만 넓은 프레임. 없으면 pad와 같다. */
  padBottom?: number;
  /** 종이 바깥 모서리 둥글기. */
  radius?: number;
}

export const FRAME_PRESETS: readonly FramePreset[] = [
  { style: 'none', label: '없음', pad: 0 },
  { style: 'plain', label: '흰 여백', paper: '#ffffff', pad: 0.035 },
  // 아래 여백이 위보다 넓다. 폴라로이드의 인상은 이 비대칭에서 나온다
  { style: 'polaroid', label: '폴라로이드', paper: '#ffffff', pad: 0.045, padBottom: 0.16 },
  { style: 'round', label: '라운드', paper: '#ffffff', pad: 0.04, radius: 0.09 },
  // 누런 종이색과 안쪽 실선. 오래된 인화지의 인상이다
  { style: 'vintage', label: '빈티지', paper: '#f3e9da', pad: 0.055, padBottom: 0.08 },
  { style: 'film', label: '필름', paper: '#15161a', pad: 0.075, radius: 0.012 },
  { style: 'gold', label: '골드 라인', pad: 0 },
  { style: 'dashed', label: '점선', pad: 0 },
  { style: 'tape', label: '테이프', pad: 0 },
];

export function findFrame(style: string): FramePreset {
  // 목록에서 사라진 프레임을 참조하는 예전 작업물도 열려야 한다
  return FRAME_PRESETS.find((preset) => preset.style === style) ?? (FRAME_PRESETS[0] as FramePreset);
}

export interface FramePadding {
  padX: number;
  padTop: number;
  padBottom: number;
}

const NO_PADDING: FramePadding = { padX: 0, padTop: 0, padBottom: 0 };

/**
 * 종이가 차지하는 여백(논리 좌표).
 * 도형으로 자른 사진에는 종이를 두르지 않는다. 하트 둘레의 네모난 종이는 액자로 보이지 않는다.
 */
export function framePadding(layer: PhotoLayer): FramePadding {
  const style = layer.border?.style ?? 'none';
  if (style === 'none' || layer.mask) return NO_PADDING;

  const preset = findFrame(style);
  if (!preset.paper) return NO_PADDING;

  const base = Math.min(layer.naturalWidth, layer.naturalHeight);
  const pad = base * preset.pad;

  return {
    padX: pad,
    padTop: pad,
    padBottom: base * (preset.padBottom ?? preset.pad),
  };
}

export function defaultBorder(style: FrameStyle): NonNullable<PhotoLayer['border']> {
  return { style, color: findFrame(style).paper ?? '#ffffff' };
}
