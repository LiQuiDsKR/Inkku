import type { Background, Layer, Project, ProjectTemplate } from './types';

/**
 * 실행취소용 스냅샷.
 *
 * 사진 픽셀은 절대 들어가지 않는다. 레이어는 imageId만 들고 있고 실제 Blob은 IndexedDB에 있다.
 * 이미지를 스냅샷에 담으면 30단계 히스토리가 수백 MB가 되어 폰에서 탭이 죽는다.
 *
 * 배열은 얕게 복사한다. 레이어 객체는 어디서든 새로 만들어 교체하고 제자리에서 고치지 않기 때문에,
 * 깊은 복사를 하면 비용만 들고 얻는 것이 없다.
 */
export interface ProjectSnapshot {
  background: Background;
  /** 카드의 글과 사진도 되돌릴 수 있어야 한다. 레이어가 아니라고 실행취소에서 빠지면 놀란다. */
  template: ProjectTemplate | null;
  layers: readonly Layer[];
}

export function takeSnapshot(project: Project): ProjectSnapshot {
  return {
    background: project.background,
    template: project.template,
    layers: project.layers,
  };
}

export function applySnapshot(project: Project, snapshot: ProjectSnapshot): Project {
  return {
    ...project,
    background: snapshot.background,
    template: snapshot.template,
    layers: [...snapshot.layers],
    updatedAt: Date.now(),
  };
}

/**
 * 레이어 목록이 실질적으로 같은지 본다.
 * 레이어 객체는 값이 바뀔 때만 새로 만들기 때문에 참조 비교로 충분하고,
 * 깊은 비교와 달리 레이어가 수십 개여도 비용이 일정하다.
 */
export function isSameLayerList(a: readonly Layer[], b: readonly Layer[]): boolean {
  return a.length === b.length && a.every((layer, index) => layer === b[index]);
}
