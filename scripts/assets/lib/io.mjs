import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 내려받기 캐시와 팩 쓰기.
 *
 * 원본은 scripts/assets/.cache에 둔다. 스크립트를 고쳐 다시 돌릴 때마다 수천 개를 다시 받으면
 * 상대 서버에 부담이고 느리다. 캐시는 저장소에 올리지 않는다(.gitignore).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..', '..');
export const CACHE_DIR = join(HERE, '..', '.cache');
export const PACKS_DIR = join(ROOT, 'public', 'assets', 'packs');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 캐시에 있으면 그것을, 없으면 받아서 캐시에 남긴다. 실패하면 두 번 더 시도한다. */
export async function cachedFetch(url, cacheName) {
  const path = join(CACHE_DIR, cacheName);
  if (existsSync(path)) return readFileSync(path);

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      const body = Buffer.from(await response.arrayBuffer());
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
      return body;
    } catch (error) {
      lastError = error;
      await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

/** 동시에 몇 개씩만 받는다. 한꺼번에 수백 개를 열면 상대 서버가 막는다. */
export async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

/**
 * 팩 하나를 다시 쓴다.
 * 원본에서 빠진 항목은 지운다. 폴더에 유령처럼 남으면 저장소만 무거워진다.
 * 폴더를 통째로 지웠다 만들지 않는다. 켜 둔 개발 서버(윈도우)가 사라졌다 생긴 파일을 놓쳐서
 * 파일이 있는데도 404 대신 index.html을 돌려준다.
 *
 * @param {object} pack index.json에 들어갈 머리 정보 (id, label, license, tintable)
 * @param {Array<{id: string, label: string, group: string, svg: string, width: number, height: number}>} items
 * @param {Array<{id: string, label: string}>} groups 목록에 보일 순서대로
 * @param {string} licenseText 함께 배포해야 하는 라이선스 원문
 */
export function writePack(pack, items, groups, licenseText) {
  const dir = join(PACKS_DIR, pack.id);
  mkdirSync(dir, { recursive: true });

  const keep = new Set(['index.json', 'LICENSE.txt', ...items.map((item) => `${item.id}.svg`)]);
  for (const file of readdirSync(dir)) {
    if (!keep.has(file)) rmSync(join(dir, file), { force: true });
  }
  for (const item of items) {
    const path = join(dir, `${item.id}.svg`);
    // 같은 내용이면 건드리지 않는다. 개발 서버가 수천 개의 바뀜 알림을 받지 않게 한다
    if (!existsSync(path) || readFileSync(path, 'utf8') !== item.svg) writeFileSync(path, item.svg);
  }

  const usedGroups = groups.filter((group) => items.some((item) => item.group === group.id));
  const index = {
    ...pack,
    groups: usedGroups,
    items: items.map(({ id, label, group, width, height }) => ({ id, label, group, width, height })),
  };
  writeFileSync(join(dir, 'index.json'), `${JSON.stringify(index)}\n`);
  writeFileSync(join(dir, 'LICENSE.txt'), licenseText);

  const bytes = items.reduce((sum, item) => sum + Buffer.byteLength(item.svg), 0);
  console.log(`${pack.id}: ${items.length}개, ${(bytes / 1e6).toFixed(1)}MB`);
}

/** 파일 이름으로 쓸 수 있는 id. 원본 이름에 공백이나 대문자가 섞여 와도 URL이 깨지지 않게 한다. */
export function toFileId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 목록에 보일 이름. 원본 이름의 하이픈을 띄어쓰기로 바꾼다. */
export function toLabel(name) {
  return name.replace(/[-_]+/g, ' ').trim();
}
