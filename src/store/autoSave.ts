import { collectImageIds } from '@/layers/imageRefs';
import { pruneImages } from '@/storage/imageStore';
import { saveProject } from '@/storage/projectRepo';
import { logDebug } from '@/utils/debugLog';
import { useProjectStore } from './projectStore';
import { useSaveStatusStore } from './saveStatusStore';
import type { Project } from '@/layers/types';

/**
 * 자동 저장.
 *
 * 폰 브라우저는 예고 없이 탭을 정리한다. 저장 버튼을 누르라고 하면 반드시 잃는 사람이 나온다.
 * 다만 변경마다 쓰면 드래그 한 번에 수십 번 IndexedDB를 두드리게 되므로 잠깐 모아서 쓴다.
 */
const SAVE_DELAY = 800;

let timer: number | null = null;

function cancelPending(): void {
  if (timer === null) return;
  window.clearTimeout(timer);
  timer = null;
}

function persist(project: Project | null): Promise<void> {
  if (!project) return Promise.resolve();
  const setStatus = useSaveStatusStore.getState().setStatus;
  setStatus('saving');

  return saveProject(project)
    .then(() => setStatus('saved'))
    .catch((error: unknown) => {
      // 저장 실패로 편집을 막지는 않는다. 사파리의 저장 공간 부족이 대표적인 원인이다.
      // 다만 실패한 것을 성공처럼 보여 주면 안 된다. 상태로 남겨 상단 바에 드러낸다.
      setStatus('failed');
      logDebug(`자동 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    });
}

/** 프로젝트 스토어를 구독해 저장을 건다. 앱 시작 시 한 번만 부른다. */
export function startAutoSave(): () => void {
  const unsubscribe = useProjectStore.subscribe((state, previous) => {
    if (state.project === previous.project) return;
    // 편집을 끝내 프로젝트가 없어진 경우는 저장할 것이 없다
    if (!state.project) {
      cancelPending();
      return;
    }
    cancelPending();
    timer = window.setTimeout(() => {
      timer = null;
      void persist(useProjectStore.getState().project);
    }, SAVE_DELAY);
  });

  return () => {
    cancelPending();
    unsubscribe();
  };
}

/**
 * 편집을 끝낼 때의 마무리.
 *
 * 화면은 먼저 넘기고 저장은 뒤에서 끝낸다. 사용자를 IndexedDB 쓰기가 끝날 때까지 기다리게 할 이유가 없다.
 * 대신 닫히는 순간의 프로젝트를 인자로 받아야 한다. 스토어는 이미 비워진 뒤일 수 있다.
 */
export async function finishEditing(project: Project | null): Promise<void> {
  cancelPending();
  await persist(project);

  /*
   * 이미지 정리는 여기서만 한다.
   * 편집 중에 하면 실행취소 기록이 가리키는 이미지를 지워서, 되돌렸을 때 그림이 사라진다.
   * 편집이 끝나면 히스토리도 함께 버려지므로 이 시점이 유일하게 안전하다.
   */
  try {
    const used = project ? collectImageIds(project) : [];
    const removed = await pruneImages(used);
    if (removed > 0) logDebug(`쓰지 않는 이미지 ${removed}개 정리`);
  } catch (error: unknown) {
    logDebug(`이미지 정리 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}
