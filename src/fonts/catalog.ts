/**
 * 감성 텍스트용 폰트 목록.
 *
 * 처음부터 전부 받아 두지 않는다. 한글 웹폰트는 한 벌이 통으로 오기 때문에
 * (조선궁서체는 3.5MB가 넘는다) 열한 벌을 미리 받으면 폰에서 첫 진입이 멈춘 것처럼 보인다.
 * 고른 시점에 하나씩 받고, 못 받으면 폴백 폰트로 그린다.
 */

export interface FontFile {
  url: string;
  /** src의 format() 값. woff2를 못 읽는 구형 사파리가 남아 있어 파일마다 다르다. */
  format: 'woff' | 'woff2';
}

export interface FontOption {
  id: string;
  label: string;
  /**
   * @font-face에 등록할 이름.
   * 로더가 등록할 때도 캔버스가 그릴 때도 이 이름이 기준이라 한 곳에서만 정한다.
   * 시스템 폰트는 등록할 것이 없어 비운다.
   */
  name: string;
  /** 캔버스와 CSS에 그대로 넘기는 family 문자열. 폴백까지 포함한다. */
  family: string;
  weight: number;
  /** 직접 등록할 웹폰트 파일. */
  file?: FontFile;
  /** @font-face가 이미 들어 있는 CSS 주소. 파일 주소가 공개되지 않은 배포본에 쓴다. */
  stylesheet?: string;
}

/** 폰트가 못 와도 글자는 보여야 한다. 어떤 폰트든 뒤에 같은 폴백을 붙인다. */
function stack(name: string): string {
  return name ? `"${name}", system-ui, sans-serif` : 'system-ui, sans-serif';
}

interface FontEntry {
  id: string;
  label: string;
  name: string;
  url: string;
  weight?: number;
  format?: 'woff' | 'woff2';
}

function webfont(entry: FontEntry): FontOption {
  return {
    id: entry.id,
    label: entry.label,
    name: entry.name,
    family: stack(entry.name),
    weight: entry.weight ?? 400,
    file: { url: entry.url, format: entry.format ?? 'woff2' },
  };
}

/** 내려받을 것이 없어 항상 즉시 그릴 수 있는 폰트. 폴백 기준점이기도 하다. */
const SYSTEM_FONT: FontOption = {
  id: 'system',
  label: '기본',
  name: '',
  family: stack(''),
  weight: 700,
};

export const DEFAULT_FONT_ID = SYSTEM_FONT.id;

const NOONNU = 'https://cdn.jsdelivr.net/gh/projectnoonnu';

export const FONT_OPTIONS: readonly FontOption[] = [
  SYSTEM_FONT,
  webfont({
    id: 'pretendard',
    label: '프리텐다드',
    name: 'Pretendard',
    url: `${NOONNU}/pretendard@1.0/Pretendard-Bold.woff2`,
    weight: 700,
  }),
  webfont({
    id: 'gowun-dodum',
    label: '고운돋움',
    name: 'GowunDodum',
    url: `${NOONNU}/noonfonts_2108@1.1/GowunDodum-Regular.woff`,
    format: 'woff',
  }),
  webfont({
    id: 'joseon-gulim',
    label: '조선굴림체',
    name: 'ChosunGu',
    url: `${NOONNU}/noonfonts_20-04@1.0/ChosunGu.woff`,
    format: 'woff',
  }),
  webfont({
    id: 'cafe24-surround',
    label: '카페24 써라운드',
    name: 'Cafe24Ssurround',
    url: `${NOONNU}/noonfonts_2105_2@1.0/Cafe24Ssurround.woff`,
    format: 'woff',
  }),
  webfont({
    id: 'aggro',
    label: '어그로체',
    name: 'SBAggro',
    url: `${NOONNU}/noonfonts_2108@1.1/SBAggroB.woff`,
    weight: 700,
    format: 'woff',
  }),
  webfont({
    id: 'okdandan',
    label: 'Ok단단체',
    name: 'OkDandan',
    url: `${NOONNU}/2508-2@1.0/OkDanDan-Bold.woff2`,
    weight: 700,
  }),
  webfont({
    id: 'jgaegu',
    label: 'J개구쟁이',
    name: 'JGaegujaengyi',
    url: `${NOONNU}/noonfonts_2110@1.0/JGaegujaengyi-Bold-KO.woff2`,
    weight: 700,
  }),
  webfont({
    id: 'kkubulim',
    label: '꾸불림체',
    name: 'BMKkubulim',
    url: `${NOONNU}/2410-1@1.0/BMkkubulimTTF-Regular.woff2`,
  }),
  {
    id: 'galmuri9',
    label: '갈무리9',
    name: 'Galmuri9',
    family: stack('Galmuri9'),
    weight: 400,
    // 갈무리는 CSS 안에서 상대 경로로 파일을 가리켜서, 파일만 따로 등록할 수 없다
    stylesheet: 'https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css',
  },
  webfont({
    // 초록우산 어린이재단의 아이들 손글씨로 만든 서체 중 가장 굵은 "대한". 그림일기 카드가 쓴다.
    // 개인/기업 무료, 배포된 파일을 고치지 않고 써야 한다(눈누 font_page/1431 라이선스).
    id: 'yoon-child',
    label: '초록우산어린이',
    name: 'YoonChildfundkoreaDaeHan',
    url: `${NOONNU}/2408@1.0/YoonChildfundkoreaDaeHan.woff2`,
  }),
  webfont({
    id: 'joseon-palace',
    label: '조선궁서체',
    name: 'ChosunGs',
    url: `${NOONNU}/noonfonts_20-04@1.0/ChosunGs.woff`,
    format: 'woff',
  }),
];

export function findFont(id: string): FontOption {
  // 목록에서 사라진 폰트를 참조하는 예전 프로젝트도 열려야 하므로 기본값으로 떨어뜨린다
  return FONT_OPTIONS.find((font) => font.id === id) ?? SYSTEM_FONT;
}
