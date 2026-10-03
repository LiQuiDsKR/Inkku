import { STICKER_DIR } from './stickerCategories';

/**
 * 에셋 팩 불러오기.
 *
 * 팩은 public/assets/packs/<id>/에 SVG 파일들과 목록(index.json)으로 놓여 있다
 * (scripts/assets/import-assets.mjs가 만든다). 팩 하나가 수천 개라 번들에 넣지 않고
 * 그 탭을 처음 열 때 목록만 받는다. 그림은 목록에서 칸이 화면에 들어올 때 받는다.
 */

export interface AssetPackItem {
  id: string;
  label: string;
  group: string;
  /** 선언 크기. 긴 변이 512로 맞춰져 있다. 레이어의 naturalWidth/Height가 된다. */
  width: number;
  height: number;
  /**
   * 팩 폴더 안의 파일 경로. 직접 넣은 스티커처럼 분류 폴더에 원래 이름 그대로 놓인 그림이 갖는다.
   * 없으면 가져오기 스크립트의 규칙(`<id>.svg`)을 따른다.
   */
  file?: string;
}

export interface AssetPackGroup {
  id: string;
  label: string;
}

export interface AssetPack {
  id: string;
  label: string;
  license: string;
  /** 한 가지 색으로 그린 팩인지. 이런 팩은 원하는 색을 입혀 붙인다. */
  tintable: boolean;
  groups: readonly AssetPackGroup[];
  items: readonly AssetPackItem[];
}

/**
 * 직접 넣은 스티커 묶음. 가져오기 스크립트의 팩과 달리 public/assets/stickers에 분류 폴더째로 놓이고,
 * 목록은 빌드가 폴더를 읽어 만든다(scripts/vite/stickerIndex.ts).
 */
export const LOCAL_STICKER_PACK = 'sticker';

/** BASE_URL을 붙여야 서브 경로에 배포해도 경로가 깨지지 않는다. */
function packBaseUrl(packId: string): string {
  const dir = packId === LOCAL_STICKER_PACK ? STICKER_DIR : `assets/packs/${packId}`;
  return `${import.meta.env.BASE_URL}${dir}`;
}

/**
 * 에셋 하나의 주소. 레이어에 그대로 저장된다.
 * 파일 이름을 바꾸면 저장된 작업물의 스티커가 사라지므로 가져오기 스크립트는 이름을 바꾸지 않는다.
 * 직접 넣은 스티커는 파일 이름을 손으로 짓기 때문에 띄어쓰기가 섞여도 깨지지 않게 마디마다 인코딩한다.
 */
export function packAssetUrl(packId: string, item: AssetPackItem): string {
  const file = item.file
    ? item.file.split('/').map(encodeURIComponent).join('/')
    : `${encodeURIComponent(item.id)}.svg`;
  return `${packBaseUrl(packId)}/${file}`;
}

/** public 폴더 아래 에셋이 사는 자리. 배포 경로 앞부분을 떼어 낼 기준이다. */
const PUBLIC_ASSET_PATH = /(?:^|\/)((?:assets\/packs|assets\/stickers|mock-assets)\/.+)$/;

/**
 * 저장된 에셋 주소를 지금의 배포 경로에 맞춘다.
 *
 * 레이어는 만들 때의 주소를 BASE_URL까지 통째로 저장한다. GitHub Pages의 하위 경로(/Inkku/)에서
 * 나중에 도메인 루트로 옮기면 예전 작업물의 스티커와 무늬 배경이 전부 404가 된다.
 * public 폴더 아래 부분만 떼어 지금의 BASE_URL에 다시 붙이면 어디로 옮겨도 열린다.
 */
export function resolveAssetUrl(url: string): string {
  const match = PUBLIC_ASSET_PATH.exec(url);
  return match?.[1] ? `${import.meta.env.BASE_URL}${match[1]}` : url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGroup(value: unknown): value is AssetPackGroup {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string';
}

function isItem(value: unknown): value is AssetPackItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.group === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    (value.file === undefined || typeof value.file === 'string')
  );
}

/** 네트워크에서 온 JSON은 믿지 않는다. 깨진 목록 하나가 패널 전체를 죽이면 안 된다. */
function parsePack(value: unknown): AssetPack {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.label !== 'string' ||
    !Array.isArray(value.groups) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('에셋 목록 형식이 맞지 않다');
  }
  return {
    id: value.id,
    label: value.label,
    license: typeof value.license === 'string' ? value.license : '',
    tintable: value.tintable === true,
    groups: value.groups.filter(isGroup),
    items: value.items.filter(isItem),
  };
}

const packs = new Map<string, Promise<AssetPack>>();

/** 같은 팩을 여러 탭이 함께 쓴다(오픈클립아트). 한 번만 받는다. */
export function loadAssetPack(packId: string): Promise<AssetPack> {
  const cached = packs.get(packId);
  if (cached) return cached;

  const promise = fetch(`${packBaseUrl(packId)}/index.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`에셋 목록을 받지 못했다: ${packId} (${response.status})`);
      return response.json() as Promise<unknown>;
    })
    .then(parsePack)
    .catch((error: unknown) => {
      // 실패를 캐시에 남기면 네트워크가 돌아와도 다시 시도할 수 없다
      packs.delete(packId);
      throw error;
    });

  packs.set(packId, promise);
  return promise;
}
