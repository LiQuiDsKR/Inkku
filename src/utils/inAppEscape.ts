import { detectInstallEnv, externalOpenUrl } from './installEnv';

/**
 * 카카오톡과 인스타그램 안의 브라우저로 열리면 뜨자마자 바깥 브라우저로 넘긴다.
 *
 * 앱 안 브라우저는 홈 화면에 추가할 수 없고, 앱을 닫으면 작업 중이던 창도 같이 사라진다.
 * 이 둘이 링크가 가장 많이 들어오는 길이라 안내를 읽게 하는 대신 바로 넘긴다.
 * 다른 앱은 넘기는 길이 앱마다 달라 확인한 것만 여기에 더한다.
 *
 * 넘기기가 막혀도 페이지는 그대로 남고, 홈 화면의 안내 시트가 손으로 여는 길을 보여 준다.
 */
const AUTO_ESCAPE_APPS = new Set(['카카오톡', '인스타그램']);

let attempted = false;

/** 이번 페이지에서 바깥으로 넘기기를 시도했는지. 안내 시트가 문구를 바꾸는 데 쓴다. */
export function escapeAttempted(): boolean {
  return attempted;
}

/** 앱이 그려지기 전에 한 번 부른다. 페이지를 열 때마다 한 번만 시도해 되풀이하지 않는다. */
export function escapeInAppBrowser(): void {
  const env = detectInstallEnv(navigator.userAgent, navigator.maxTouchPoints, false);
  if (env.kind !== 'in-app' || !AUTO_ESCAPE_APPS.has(env.app)) return;

  // 시작 주소가 아니라 지금 주소를 넘긴다. 링크에 붙어 온 값을 바깥 브라우저에서도 그대로 받는다
  const target = externalOpenUrl(env, window.location.href);
  if (!target) return;

  attempted = true;
  window.location.href = target;
}
