/**
 * 개발용 더미 스티커 목록.
 *
 * 실제 에셋은 기획/디자인에서 나온다. 그때 이 파일만 갈아 끼우면 되도록
 * 컴포넌트가 파일명을 직접 알지 못하게 카탈로그로 감싼다.
 */

/** 목업 스티커는 전부 256 정사각형 SVG다. 개별 크기가 생기면 항목마다 값을 넣는다. */
const MOCK_SIZE = 256;

export interface StickerAsset {
  id: string;
  label: string;
  url: string;
  width: number;
  height: number;
}

export interface StickerCategory {
  id: string;
  label: string;
  items: readonly StickerAsset[];
}

/** BASE_URL을 붙여야 서브 경로에 배포해도 경로가 깨지지 않는다. */
function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}mock-assets/${file}`;
}

function sticker(id: string, label: string): StickerAsset {
  return { id, label, url: assetUrl(`${id}.svg`), width: MOCK_SIZE, height: MOCK_SIZE };
}

export const STICKER_CATEGORIES: readonly StickerCategory[] = [
  {
    id: 'shape',
    label: '도형',
    items: [
      sticker('heart', '하트'),
      sticker('star', '별'),
      sticker('circle', '원'),
      sticker('square', '사각형'),
      sticker('triangle', '삼각형'),
      sticker('blob', '덩어리'),
    ],
  },
  {
    id: 'bubble',
    label: '말풍선',
    items: [
      sticker('bubble-round', '둥근 말풍선'),
      sticker('bubble-rect', '네모 말풍선'),
      sticker('bubble-think', '생각 말풍선'),
      sticker('bubble-burst', '폭발 말풍선'),
    ],
  },
  {
    id: 'deco',
    label: '꾸밈',
    items: [
      sticker('sparkle', '반짝'),
      sticker('halo', '후광'),
      sticker('ribbon', '리본'),
      sticker('dots', '점무늬'),
    ],
  },
  {
    id: 'doodle',
    label: '낙서',
    items: [
      sticker('arrow-curve', '곡선 화살표'),
      sticker('underline', '밑줄'),
      sticker('circle-mark', '동그라미'),
      sticker('check', '체크'),
      sticker('scribble', '물결'),
      sticker('cross', '엑스'),
    ],
  },
];

export function findStickerAsset(id: string): StickerAsset | undefined {
  for (const category of STICKER_CATEGORIES) {
    const found = category.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}
