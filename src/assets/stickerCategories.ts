/**
 * 직접 넣은 스티커의 분류.
 *
 * 폴더 이름은 영문 소문자로 두고 화면에 보일 이름은 여기서 붙인다. 폴더에 한글과 띄어쓰기와 가운뎃점을
 * 쓰면 주소마다 인코딩해야 하고, 운영체제마다 한글 파일 이름을 다르게 저장해서(맥은 자모를 풀어 쓴다)
 * 개발 PC에서는 열리던 그림이 배포 서버에서만 404가 나는 일이 생긴다.
 *
 * 이 목록은 빌드 플러그인(scripts/vite/stickerIndex.ts)이 읽어 칩의 이름과 순서를 정한다.
 * 목록에 없는 폴더도 보이긴 한다. 폴더 이름이 그대로 칩 이름이 되고, "기타" 바로 앞에 선다.
 */

/** public 아래 스티커 폴더. 앱의 주소와 빌드 플러그인이 같은 값을 쓴다. */
export const STICKER_DIR = 'assets/stickers';

export interface StickerCategory {
  /** 폴더 이름 */
  id: string;
  label: string;
}

export const STICKER_CATEGORIES: readonly StickerCategory[] = [
  { id: 'animal', label: '고양이 · 동물' },
  { id: 'flower', label: '꽃' },
  { id: 'ribbon', label: '리본' },
  { id: 'star', label: '별' },
  { id: 'food', label: '음식' },
  { id: 'retro', label: '음악 · 레트로' },
  { id: 'sea', label: '조개 · 바다' },
  { id: 'heart', label: '하트' },
  { id: 'etc', label: '기타' },
];

/** 언제나 맨 뒤에 서는 분류. 새 폴더가 생겨도 그 뒤로 밀리지 않는다. */
export const LAST_STICKER_CATEGORY = 'etc';
