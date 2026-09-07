import type { Project } from './types';

/**
 * 프로젝트가 실제로 참조하는 이미지 id를 모은다.
 *
 * 레이어를 지워도 IndexedDB의 Blob은 남는다. 사진 한 장이 몇 MB라 정리하지 않으면
 * 저장 공간이 계속 늘어난다. 다만 정리 시점은 조심해야 한다.
 * 실행취소 기록이 살아 있는 동안 지우면 되돌렸을 때 그림이 비어 버린다.
 */
export function collectImageIds(project: Project): string[] {
  const ids = new Set<string>();

  for (const layer of project.layers) {
    if (layer.type === 'photo' || layer.type === 'drawing') ids.add(layer.imageId);
  }

  // 배경으로 쓰는 사진도 참조다. 레이어를 지웠다고 배경까지 깨지면 안 된다.
  if (project.background.type === 'photoBlur') ids.add(project.background.imageId);

  return [...ids];
}
