import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  LAST_STICKER_CATEGORY,
  STICKER_CATEGORIES,
  STICKER_DIR,
} from '../../src/assets/stickerCategories';

/**
 * 직접 넣은 스티커(public/assets/stickers)의 목록을 만든다.
 *
 * 공개 에셋 팩은 가져오기 스크립트가 목록(index.json)까지 써 주지만, 이 폴더는 기획/디자인이
 * 분류 폴더에 그림을 넣기만 하는 곳이다. 목록을 손으로 고치게 하면 반드시 빠뜨린다.
 * 그래서 개발 서버는 요청이 올 때마다, 빌드는 결과물을 쓸 때 폴더를 읽어 목록을 만든다.
 * 목록 형식은 에셋 팩과 같아서 요소 패널의 에셋 탭이 그대로 그린다.
 *
 * - 폴더 하나가 묶음 하나다. 칩 이름과 순서는 분류 목록(src/assets/stickerCategories.ts)이 정한다.
 *   목록에 없는 새 폴더는 폴더 이름 그대로 "기타" 앞에 선다. 폴더를 만들기만 해도 패널에 나와야 한다.
 * - 크기는 파일 머리말에서 읽는다(webp, png). 레이어가 처음 놓일 크기를 정하는 데 필요하다.
 * - 비어 있거나 읽을 수 없는 파일은 뺀다. 목록에 넣으면 패널에 빈 칸이 생긴다.
 */

const INDEX = `${STICKER_DIR}/index.json`;

interface Size {
  width: number;
  height: number;
}

function webpSize(buffer: Buffer): Size | null {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function pngSize(buffer: Buffer): Size | null {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function imageSize(file: string): Size | null {
  const buffer = readFileSync(file);
  if (buffer.length < 32) return null;
  const size = webpSize(buffer) ?? pngSize(buffer);
  return size && size.width > 0 && size.height > 0 ? size : null;
}

/** 'brown-kitten-400_00be2007d8' 같은 이름에서 사람이 읽을 부분. 숫자뿐이면 묶음 이름으로 부른다. */
function labelOf(stem: string, group: string): string {
  const name = stem.replace(/-\d+_[0-9a-f]{6,}$/i, '').replace(/-/g, ' ').trim();
  return /^[\d\s]+$/.test(name) ? group : name;
}

const byName = (a: string, b: string) => a.localeCompare(b, 'ko', { numeric: true });

/** 목록에 적힌 순서, 그다음 목록에 없는 폴더(이름순), 맨 뒤에 기타. */
function rankOf(folder: string): number {
  if (folder === LAST_STICKER_CATEGORY) return Number.MAX_SAFE_INTEGER;
  const index = STICKER_CATEGORIES.findIndex((category) => category.id === folder);
  return index >= 0 ? index : STICKER_CATEGORIES.length;
}

function labelOfFolder(folder: string): string {
  return STICKER_CATEGORIES.find((category) => category.id === folder)?.label ?? folder;
}

function buildIndex(publicDir: string): string {
  const root = path.join(publicDir, STICKER_DIR);
  let folders: string[] = [];
  try {
    folders = readdirSync(root).filter((name) => statSync(path.join(root, name)).isDirectory());
  } catch {
    // 폴더가 없으면 빈 목록이다. 스티커 탭이 비어 보일 뿐 앱은 돈다
  }
  folders.sort((a, b) => rankOf(a) - rankOf(b) || byName(a, b));

  const items = folders.flatMap((group) =>
    readdirSync(path.join(root, group))
      .filter((file) => /\.(webp|png)$/i.test(file))
      .sort(byName)
      .flatMap((file) => {
        const size = imageSize(path.join(root, group, file));
        if (!size) return [];
        const stem = file.replace(/\.[^.]+$/, '');
        return [
          { id: stem, label: labelOf(stem, labelOfFolder(group)), group, file: `${group}/${file}`, ...size },
        ];
      }),
  );

  const groups = folders
    .filter((group) => items.some((item) => item.group === group))
    .map((group) => ({ id: group, label: labelOfFolder(group) }));

  return JSON.stringify({ id: 'sticker', label: '스티커', license: '', tintable: false, groups, items });
}

export function stickerIndexPlugin(): Plugin {
  let publicDir = '';
  let base = '/';

  return {
    name: 'inkku-sticker-index',
    configResolved(config) {
      publicDir = config.publicDir;
      base = config.base;
    },
    // 개발 중에는 요청마다 새로 읽는다. 그림을 폴더에 넣고 패널을 다시 열면 바로 보인다
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url ?? '').split('?')[0] !== `${base}${INDEX}`) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(buildIndex(publicDir));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: INDEX, source: buildIndex(publicDir) });
    },
  };
}
