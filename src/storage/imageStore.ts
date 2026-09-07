import { getDB, type StoredImage } from './db';

export async function putImage(image: StoredImage): Promise<void> {
  const db = await getDB();
  await db.put('images', image);
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  const db = await getDB();
  return db.get('images', id);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('images', id);
}

/**
 * 프로젝트가 더 이상 참조하지 않는 이미지를 지운다.
 * 레이어를 지워도 IndexedDB의 Blob은 남아서, 정리하지 않으면 저장 공간이 계속 늘어난다.
 * 실제 호출은 자동 저장이 붙는 Phase 4에서 한다.
 */
export async function pruneImages(usedIds: readonly string[]): Promise<number> {
  const db = await getDB();
  const keep = new Set(usedIds);
  const all = await db.getAllKeys('images');
  const removals = all.filter((key) => !keep.has(key));
  await Promise.all(removals.map((key) => db.delete('images', key)));
  return removals.length;
}
