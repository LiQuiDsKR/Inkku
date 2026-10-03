import { useEffect, useRef } from 'react';

interface GuardState {
  inkkuGuard: true;
}

function isGuard(state: unknown): state is GuardState {
  return typeof state === 'object' && state !== null && 'inkkuGuard' in state;
}

/**
 * 안드로이드 뒤로가기(와 브라우저 뒤로 버튼)를 앱 안의 "한 단계 뒤로"로 바꾼다.
 *
 * 라우터가 없는 앱이라 뒤로가기를 누르면 브라우저가 페이지를 떠나 버린다. 패널을 닫으려다
 * 편집 화면이 통째로 사라지는 것이 웹 페이지라는 걸 가장 크게 느끼게 하는 순간이다.
 * 기록에 막 하나를 깔아 두고, 그 막이 걷힐 때(popstate) 앱이 한 단계를 처리한 뒤 다시 깐다.
 *
 * 막은 언제나 하나뿐이다. 앱 안의 버튼으로 홈에 돌아와도 막을 걷지 않는다(history.back은
 * 비동기라 StrictMode의 마운트 되감기와 엉킨다). 그 대신 홈에서는 뒤로가기를 한 번 더 눌러야 나간다.
 *
 * @param active 앱 안에 머물 단계가 있는 화면인지(편집, 비율 고르기).
 * @param onBack 한 단계를 처리한다. 아직 머물 화면이면 true를 돌려준다.
 */
export function useBackGuard(active: boolean, onBack: () => boolean): void {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    if (!isGuard(window.history.state)) window.history.pushState({ inkkuGuard: true }, '');

    const handlePop = () => {
      const stay = onBackRef.current();
      if (stay) window.history.pushState({ inkkuGuard: true }, '');
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [active]);
}
