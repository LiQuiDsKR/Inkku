import { useEffect } from 'react';
import type Konva from 'konva';
import { resolvePick } from './pixelPick';
import { useProjectStore } from '@/store/projectStore';

/** 누를 때와 뗄 때만 픽셀을 본다. 이 이벤트들 사이에서만 판정이 바뀐다. */
const PICK_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'];

/**
 * 같은 손가락 하나에 pointerdown과 touchstart(또는 mousedown)가 둘 다 온다.
 * 같은 자리를 이 시간 안에 다시 물으면 앞의 답을 쓴다.
 */
const REUSE_MS = 400;

interface PickMemo {
  x: number;
  y: number;
  at: number;
  shape: Konva.Shape | null;
}

function isParticle(id: string): boolean {
  return useProjectStore.getState().project?.layers.some(
    (layer) => layer.id === id && layer.type === 'particle',
  ) ?? false;
}

/**
 * 스테이지의 히트 판정을 "눌린 자리에 실제로 그려진 요소"로 바꾼다(`pixelPick.ts`).
 *
 * Konva는 누르기, 떼기, 끌기 시작, 두 번 누르기를 전부 `getIntersection` 하나로 정한다.
 * 그 함수만 바꿔 끼우면 선택과 끌기와 꾹 누르기가 따로 고치지 않아도 같은 요소를 향한다.
 * 손가락이 움직일 때마다 부르는 판정(hover)은 그대로 둔다. 매번 그려 보기에는 비싸다.
 *
 * 누르는 이벤트인지는 스테이지 바깥 상자에서 가로채 안다. 캡처 단계에서 켜고
 * 버블 단계에서 끄면 그 사이에 Konva의 처리(캔버스에 걸린 리스너)가 끼어 있다.
 */
export function usePixelPicking(stage: Konva.Stage | null): void {
  useEffect(() => {
    if (!stage) return;

    const container = stage.container();
    const original = stage.getIntersection.bind(stage);
    let armed = false;
    let memo: PickMemo | null = null;

    stage.getIntersection = (pos) => {
      const hit = original(pos);
      if (!armed || !pos) return hit;

      const now = performance.now();
      if (
        memo &&
        memo.x === pos.x &&
        memo.y === pos.y &&
        now - memo.at < REUSE_MS &&
        (!memo.shape || memo.shape.getStage())
      ) {
        return memo.shape;
      }

      const shape = resolvePick(stage, hit, pos, isParticle);
      memo = { x: pos.x, y: pos.y, at: now, shape };
      return shape;
    };

    const arm = () => {
      armed = true;
    };
    const disarm = () => {
      armed = false;
    };

    for (const type of PICK_EVENTS) {
      container.addEventListener(type, arm, { capture: true, passive: true });
      container.addEventListener(type, disarm, { passive: true });
    }

    return () => {
      for (const type of PICK_EVENTS) {
        container.removeEventListener(type, arm, { capture: true });
        container.removeEventListener(type, disarm);
      }
      // 인스턴스에 덮어쓴 것을 지우면 원래 메서드(프로토타입)로 돌아간다
      Reflect.deleteProperty(stage, 'getIntersection');
    };
  }, [stage]);
}
