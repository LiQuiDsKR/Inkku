import { useLayoutEffect, useState } from 'react';

export interface VisualViewportBox {
  /** 보이는 영역의 윗변. iOS는 키보드가 뜨면 화면을 밀어 올려서 0이 아니게 된다. */
  top: number;
  /** 보이는 영역의 높이. 키보드가 떠 있으면 키보드 위까지만이다. */
  height: number;
  keyboardOpen: boolean;
}

/** 이만큼은 줄어야 키보드로 본다. 주소창이 숨고 나타나는 정도의 변화는 키보드가 아니다. */
const KEYBOARD_MIN_HEIGHT = 150;

/**
 * 화면 폭(방향)마다 키보드 없이 본 가장 큰 높이.
 * 안드로이드는 설정에 따라 키보드가 뜰 때 innerHeight까지 줄어서 그것만으로는 비교할 기준이 없다.
 * 모듈에 두어 창을 닫았다 다시 열어도 기준을 잃지 않는다.
 */
const fullHeights = new Map<number, number>();

/** 키보드를 띄우지 않는 입력. 슬라이더를 만지는 동안 창 높이가 줄었다고 키보드로 보면 안 된다. */
const NON_TEXT_INPUTS = new Set(['range', 'checkbox', 'radio', 'button', 'color', 'file']);

/** 입력칸에 커서가 있을 때만 키보드로 본다. 데스크톱에서 창 높이를 줄인 것은 키보드가 아니다. */
function isTyping(): boolean {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable || element instanceof HTMLTextAreaElement) return true;
  return element instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(element.type);
}

function readViewport(): VisualViewportBox {
  const viewport = window.visualViewport;
  const top = viewport ? viewport.offsetTop : 0;
  const height = viewport ? viewport.height : window.innerHeight;
  const widthKey = Math.round(viewport ? viewport.width : window.innerWidth);

  // iOS는 키보드가 떠도 innerHeight가 그대로라, 키보드가 뜬 채로 열려도 기준을 바로 잡는다
  const full = Math.max(fullHeights.get(widthKey) ?? 0, height, window.innerHeight);
  fullHeights.set(widthKey, full);

  return { top, height, keyboardOpen: isTyping() && full - height > KEYBOARD_MIN_HEIGHT };
}

/**
 * 키보드 위로 실제로 보이는 영역을 따라간다.
 *
 * iOS 사파리는 키보드가 떠도 화면 높이(dvh, innerHeight)를 줄이지 않고 그 위를 덮는다.
 * 화면 전체에 맞춘 창은 아래쪽 절반이 키보드 뒤로 들어가서, 가운데 둔 입력칸이 안 보인다.
 * 이 영역에 맞춰 창을 세우면 키보드가 뜨고 지는 대로 창이 줄고 늘어난다.
 */
export function useVisualViewport(): VisualViewportBox {
  const [box, setBox] = useState<VisualViewportBox>(readViewport);

  // 그리기 전에 맞춘다. 키보드가 뜬 채로 열리면 한 프레임 동안 창이 키보드 뒤까지 내려간다
  useLayoutEffect(() => {
    const update = () => {
      const next = readViewport();
      setBox((prev) =>
        prev.top === next.top && prev.height === next.height && prev.keyboardOpen === next.keyboardOpen
          ? prev
          : next,
      );
    };

    /*
     * 탭을 눌러 키보드를 내리면 크기가 바뀌기 전에 커서부터 빠진다. 접어 둔 줄을 바로 펼친다.
     * focusout 안에서는 커서가 다음 칸으로 옮겨 가기 전이라 한 틱 뒤에 잰다.
     */
    let timer = 0;
    const updateAfterFocus = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 0);
    };

    update();
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', updateAfterFocus);
    document.addEventListener('focusout', updateAfterFocus);
    return () => {
      window.clearTimeout(timer);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', updateAfterFocus);
      document.removeEventListener('focusout', updateAfterFocus);
    };
  }, []);

  return box;
}
