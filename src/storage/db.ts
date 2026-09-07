import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Project } from '@/layers/types';

/** IndexedDB에 실제로 저장되는 이미지 레코드. 사진과 굳힌 낙서가 모두 여기로 들어간다. */
export interface StoredImage {
  id: string;
  blob: Blob;
  width: number;
  height: number;
  createdAt: number;
}

interface InkkuDB extends DBSchema {
  images: { key: string; value: StoredImage };
  projects: { key: string; value: Project };
}

const DB_NAME = 'inkku';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InkkuDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<InkkuDB>> {
  // 커넥션을 매번 열면 iOS에서 누적되어 느려진다. 최초 한 번만 열고 재사용한다.
  if (!dbPromise) {
    dbPromise = openDB<InkkuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
        // 작업물은 최근 1개만 다루지만 스토어는 지금 만들어 둔다.
        // 나중에 추가하면 DB 버전을 올려야 하고, 이미 깔린 앱의 마이그레이션이 필요해진다.
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
