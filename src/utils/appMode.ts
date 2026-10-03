/**
 * 브라우저 안에서 앱처럼 보이게 하는 장치들.
 *
 * 전체 화면은 브라우저마다 지원이 다르다. 안드로이드 크롬은 Fullscreen API로 주소창까지 숨길 수 있지만,
 * 아이폰 사파리는 영상 말고는 전체 화면을 허락하지 않는다. 아이폰에서 주소창 없이 쓰는 길은
 * "홈 화면에 추가" 하나뿐이라 그때는 버튼 대신 안내를 띄운다.
 */

/** 사파리는 아직 접두사 붙은 이름만 갖고 있다(아이패드). 표준 이름과 같이 본다. */
interface WebkitDocument {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function webkitDocument(): WebkitDocument {
  return document as Document & WebkitDocument;
}

export function canFullscreen(): boolean {
  return Boolean(document.fullscreenEnabled || webkitDocument().webkitFullscreenEnabled);
}

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement || webkitDocument().webkitFullscreenElement);
}

/**
 * 이번에 켜 둔 전체 화면을 다시 켤지.
 * 안드로이드 뒤로가기는 전체 화면을 먼저 풀어 버린다. 사용자가 켜 둔 적이 있으면
 * 다음에 화면을 누를 때(새로 만들기, 이어서 하기) 조용히 다시 켠다.
 */
let wanted = false;

export async function enterFullscreen(): Promise<void> {
  wanted = true;
  if (isFullscreen()) return;
  const root = document.documentElement as HTMLElement & WebkitElement;
  try {
    if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' });
    else await root.webkitRequestFullscreen?.();
  } catch {
    // 사용자 동작 없이 부르면 거절된다. 전체 화면은 덤이라 실패해도 앱은 그대로 쓴다.
  }
}

export async function exitFullscreen(): Promise<void> {
  wanted = false;
  if (!isFullscreen()) return;
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else await webkitDocument().webkitExitFullscreen?.();
  } catch {
    // 이미 풀렸으면 거절된다. 결과가 같으니 무시한다.
  }
}

/** 화면을 누른 순간에 부른다. 켜 둔 적이 있는데 풀려 있으면 다시 켠다. */
export function resumeFullscreen(): void {
  if (wanted && canFullscreen() && !isFullscreen()) void enterFullscreen();
}

/** 홈 화면 아이콘으로 열렸는지. 이미 주소창이 없으니 안내를 띄울 이유가 없다. */
export function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    legacy ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
}

/** 아이폰과 아이패드. 아이패드 사파리는 맥처럼 자신을 소개해서 터치 지점 수로 가려낸다. */
export function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
  );
}

/**
 * 웹 페이지 티가 나는 기본 동작을 막는다. 앱이 뜰 때 한 번만 건다.
 *
 * 아이폰은 user-scalable=no를 무시해서(접근성 때문이다) 두 손가락으로 벌리면 화면 전체가 커진다.
 * 캔버스 밖, 예컨대 패널 위에서 핀치를 하면 툴바까지 확대되어 앱이 망가진 것처럼 보인다.
 * 사파리 전용 gesture 이벤트를 막으면 확대만 멈추고 터치 이벤트는 그대로 온다(캔버스 핀치는 산다).
 *
 * 꾹 누르면 뜨는 메뉴(이미지 저장, 링크 열기)도 막는다. 입력칸에서는 붙여넣기가 필요해서 남긴다.
 */
export function installAppShellGuards(): void {
  const stopZoom = (event: Event) => event.preventDefault();
  document.addEventListener('gesturestart', stopZoom, { passive: false });
  document.addEventListener('gesturechange', stopZoom, { passive: false });

  document.addEventListener('contextmenu', (event) => {
    if (!isEditable(event.target)) event.preventDefault();
  });
}
