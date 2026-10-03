import type { TextStickerStyle } from './textSticker';

/**
 * 문구 스티커 프리셋.
 *
 * 글꼴까지 한 세트다. 고르면 완성된 모양이 바로 나와야 하고, 고친 뒤에도 세트로 돌아올 수 있어야 한다.
 * 글꼴은 가벼운 것만 쓴다(Ok단단체 80KB, 어그로체 240KB, 카페24 써라운드, J개구쟁이, 갈무리9 400KB대).
 * 프리셋 목록을 열면 견본을 그리려고 이 글꼴들을 받는다. 조선궁서체(3.6MB) 같은 무거운 글꼴을 넣으면
 * 패널을 여는 것만으로 LTE에서 몇 초가 걸린다.
 *
 * 견본 문구는 그 스타일이 가장 잘 어울리는 말이다. 편집 화면은 이 문구를 고른 상태로 열어서,
 * 바로 치면 내 문구로 바뀌고 그대로 완료하면 견본 문구가 붙는다.
 */
export interface TextStickerPreset {
  id: string;
  label: string;
  sample: string;
  style: TextStickerStyle;
}

const INK = '#22242a';

export const TEXT_STICKER_PRESETS: readonly TextStickerPreset[] = [
  {
    id: 'pink-fluffy',
    label: '몽글 핑크',
    sample: '오늘도 화이팅',
    style: {
      fontId: 'cafe24-surround',
      color: '#ff4d88',
      outline: { color: '#ffffff', width: 0.16 },
      plate: { shape: 'ellipse', color: '#ffd6e7', opacity: 1, soft: 0.18, pad: 0.45 },
    },
  },
  {
    id: 'butter-memo',
    label: '버터 메모',
    sample: '조은 아침',
    style: {
      fontId: 'jgaegu',
      color: '#6b5444',
      plate: { shape: 'round', color: '#fff3a8', opacity: 1, soft: 0.08, pad: 0.45 },
    },
  },
  {
    id: 'night-sky',
    label: '밤하늘',
    sample: 'good night .o',
    style: {
      fontId: 'jgaegu',
      color: INK,
      outline: { color: '#ffffff', width: 0.08 },
      plate: { shape: 'ellipse', color: '#b8dcff', opacity: 1, soft: 0.3, pad: 0.45 },
    },
  },
  {
    id: 'pixel-box',
    label: '픽셀 네모칸',
    sample: '너무 좋은 느낌',
    style: {
      fontId: 'galmuri9',
      color: INK,
      plate: {
        shape: 'rect',
        color: '#ffffff',
        opacity: 1,
        soft: 0,
        pad: 0.25,
        border: { color: INK, width: 0.06 },
      },
    },
  },
  {
    id: 'burst',
    label: '폭발',
    sample: '빨리\n일어나',
    style: {
      fontId: 'aggro',
      color: INK,
      plate: {
        shape: 'burst',
        color: '#ffffff',
        opacity: 1,
        soft: 0,
        pad: 0.45,
        border: { color: INK, width: 0.06 },
      },
    },
  },
  {
    id: 'chat',
    label: '말풍선',
    sample: '뭐해?',
    style: {
      fontId: 'system',
      color: INK,
      plate: {
        shape: 'bubble',
        color: '#ffffff',
        opacity: 1,
        soft: 0,
        pad: 0.45,
        border: { color: INK, width: 0.035 },
      },
    },
  },
  {
    id: 'heart',
    label: '하트 뿅',
    sample: '귀여워',
    style: {
      fontId: 'cafe24-surround',
      color: '#ff4d88',
      outline: { color: '#ffffff', width: 0.16 },
      plate: { shape: 'heart', color: '#ffc9c9', opacity: 1, soft: 0, pad: 0.45 },
    },
  },
  {
    id: 'mint-tag',
    label: '민트 태그',
    sample: '#오늘의기록',
    style: {
      fontId: 'okdandan',
      color: '#0b7a5a',
      plate: {
        shape: 'pill',
        color: '#c3fae8',
        opacity: 1,
        soft: 0,
        pad: 0.45,
        border: { color: '#0b7a5a', width: 0.035 },
      },
    },
  },
  {
    id: 'tape',
    label: '마스킹 테이프',
    sample: '소소한 하루',
    style: {
      fontId: 'jgaegu',
      color: '#5c4a3d',
      plate: { shape: 'tape', color: '#ffe8a3', opacity: 0.75, soft: 0, pad: 0.45 },
    },
  },
  {
    id: 'cloud',
    label: '구름',
    sample: '맑음',
    style: {
      fontId: 'cafe24-surround',
      color: '#4c6ef5',
      plate: {
        shape: 'cloud',
        color: '#ffffff',
        opacity: 1,
        soft: 0,
        pad: 0.45,
        border: { color: '#b8dcff', width: 0.06 },
      },
    },
  },
  {
    id: 'lace',
    label: '레이스',
    sample: 'thank you',
    style: {
      fontId: 'jgaegu',
      color: '#8a5a44',
      plate: {
        shape: 'scallop',
        color: '#f8f0dd',
        opacity: 1,
        soft: 0,
        pad: 0.45,
        border: { color: '#e8b98a', width: 0.035 },
      },
    },
  },
  {
    id: 'ribbon',
    label: '리본띠',
    sample: '축하해',
    style: {
      fontId: 'aggro',
      color: '#ffffff',
      plate: { shape: 'ribbon', color: '#ff6b9d', opacity: 1, soft: 0, pad: 0.45 },
    },
  },
  {
    id: 'star',
    label: '반짝 별',
    sample: '최고',
    style: {
      fontId: 'okdandan',
      color: '#ff7a1a',
      outline: { color: '#ffffff', width: 0.16 },
      plate: { shape: 'star', color: '#ffe066', opacity: 1, soft: 0, pad: 0.45 },
    },
  },
  {
    id: 'cutout',
    label: '흰 테두리',
    sample: '최고야!',
    style: {
      fontId: 'aggro',
      color: '#ff4d88',
      outline: { color: '#ffffff', width: 0.42 },
    },
  },
  {
    id: 'glow',
    label: '네온',
    sample: 'LOVE',
    style: {
      fontId: 'aggro',
      color: '#ffffff',
      plate: { shape: 'ellipse', color: '#ff4d88', opacity: 1, soft: 0.48, pad: 0.45 },
    },
  },
];

/** 목록에서 사라진 프리셋을 가리키면 첫 프리셋으로 연다. 편집 화면이 빈 채로 열리면 안 된다. */
export function findTextStickerPreset(id: string): TextStickerPreset | undefined {
  return TEXT_STICKER_PRESETS.find((preset) => preset.id === id) ?? TEXT_STICKER_PRESETS[0];
}
