import { getDB } from './db';
import type { Project } from '@/layers/types';

/**
 * 작업물 저장.
 *
 * 여러 개를 남기지 않는다. 목록 화면과 삭제 UI가 필요해지는데,
 * 지금 필요한 것은 "앱을 껐다 켜도 하던 작업이 살아 있는 것" 하나뿐이다.
 */
export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction('projects', 'readwrite');
  const store = transaction.objectStore('projects');

  await store.put(project);

  // 예전 작업물이 남아 있으면 "이어서 편집"이 어느 것을 열지 애매해진다
  const keys = await store.getAllKeys();
  await Promise.all(keys.filter((key) => key !== project.id).map((key) => store.delete(key)));

  await transaction.done;
}

export async function loadLatestProject(): Promise<Project | null> {
  const db = await getDB();
  const all = await db.getAll('projects');
  if (all.length === 0) return null;

  return all.reduce((latest, current) => (current.updatedAt > latest.updatedAt ? current : latest));
}

export async function clearProjects(): Promise<void> {
  const db = await getDB();
  await db.clear('projects');
}
