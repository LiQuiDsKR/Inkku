/**
 * 마우스 휠로 가로 칩 줄을 넘기게 한다.
 *
 * 색, 분류, 보정 프리셋 같은 줄은 손가락으로 옆으로 미는 것을 전제로 스크롤바까지 숨겨 두었다(.no-scrollbar).
 * 마우스에는 옆으로 미는 동작이 없어서 PC에서는 첫 화면 너머의 칩에 닿을 길이 없다.
 * 세로 휠을 그 줄의 가로 이동으로 바꿔 준다. 줄 끝에 닿으면 놓아줘서 패널 전체의 세로 스크롤로 이어진다.
 *
 * 줄마다 훅을 다는 대신 문서에 하나만 건다. 새 칩 줄을 만들 때 잊어버릴 일이 없다.
 */

/** deltaMode가 줄/페이지 단위인 경우(파이어폭스)가 있어 픽셀로 환산한다. */
function toPixels(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * 100;
  return event.deltaY;
}

function findRow(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const row = target.closest<HTMLElement>('.no-scrollbar');
  return row && row.scrollWidth > row.clientWidth ? row : null;
}

export function installWheelRows(): void {
  document.addEventListener(
    'wheel',
    (event) => {
      // 터치패드의 가로 쓸기와 확대(ctrl)는 브라우저가 알아서 한다
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const row = findRow(event.target);
      if (!row) return;

      const delta = toPixels(event);
      const max = row.scrollWidth - row.clientWidth;
      const atEdge = delta < 0 ? row.scrollLeft <= 0 : row.scrollLeft >= max - 1;
      if (atEdge) return;

      event.preventDefault();
      row.scrollLeft += delta;
    },
    { passive: false },
  );
}
