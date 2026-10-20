/**
 * 지금 어느 브라우저에서 열렸는지 가려서 "홈 화면에 추가"로 가는 길을 고른다.
 *
 * 설치 창을 코드로 띄울 수 있는 곳은 크롬 계열뿐이고, 나머지는 사람이 메뉴를 찾아가야 한다.
 * 메뉴 자리는 브라우저마다 달라서 "브라우저 메뉴에서 찾으라"고만 쓰면 대부분 못 찾는다.
 * 그래서 사용자 에이전트로 브라우저를 가려 그 브라우저의 버튼 이름과 자리를 그대로 알려 준다.
 *
 * 인스타그램과 카카오톡 안의 브라우저는 홈 화면에 추가할 길이 아예 없다.
 * 인스타에 올릴 사진을 꾸미는 앱이라 첫 방문이 인스타 프로필 링크일 가능성이 높아서 따로 다룬다.
 */

export type InstallEnv =
  | { kind: 'installed' }
  /** modernMenu: 사파리 26부터 공유 버튼이 주소창 옆 더보기(···) 안으로 들어갔다. */
  | { kind: 'ios-safari'; modernMenu: boolean }
  | { kind: 'ios-browser'; browser: string }
  /** iosVersion: 사파리로 넘기는 주소(x-safari-)가 iOS 17부터 된다. 안드로이드는 0이다. */
  | { kind: 'in-app'; app: string; os: 'ios' | 'android'; kakao: boolean; iosVersion: number }
  | { kind: 'android-chrome' }
  | { kind: 'android-samsung' }
  | { kind: 'android-browser'; browser: string }
  | { kind: 'desktop' };

/** 앞에서부터 맞춰 본다. 카카오톡 안의 브라우저도 Safari 토큰을 달고 있어서 앱을 먼저 본다. */
const IN_APP_MARKERS: readonly { pattern: RegExp; app: string }[] = [
  { pattern: /Instagram/i, app: '인스타그램' },
  { pattern: /Barcelona/, app: '스레드' },
  { pattern: /FBAN|FBAV|FB_IAB/, app: '페이스북' },
  { pattern: /KAKAOTALK/i, app: '카카오톡' },
  { pattern: /NAVER\(inapp/, app: '네이버' },
  { pattern: /\bLine\//, app: '라인' },
  { pattern: /DaumApps/, app: '다음' },
  { pattern: /BAND\//, app: '밴드' },
  { pattern: /everytimeApp/i, app: '에브리타임' },
];

const IOS_BROWSERS: readonly { pattern: RegExp; browser: string }[] = [
  { pattern: /CriOS/, browser: '크롬' },
  { pattern: /FxiOS/, browser: '파이어폭스' },
  { pattern: /EdgiOS/, browser: '엣지' },
  { pattern: /Whale\//, browser: '웨일' },
];

const ANDROID_BROWSERS: readonly { pattern: RegExp; browser: string }[] = [
  { pattern: /Firefox\//, browser: '파이어폭스' },
  { pattern: /EdgA\//, browser: '엣지' },
  { pattern: /Whale\//, browser: '웨일' },
  { pattern: /OPR\//, browser: '오페라' },
];

/** 아이패드 사파리는 맥처럼 자신을 소개해서 터치 지점 수로 가려낸다. */
function isApple(ua: string, touchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && touchPoints > 1);
}

function findInApp(ua: string): string | null {
  return IN_APP_MARKERS.find((marker) => marker.pattern.test(ua))?.app ?? null;
}

/**
 * 사용자 에이전트만 보고 고르는 순수 함수. 브라우저 밖에서 시험할 수 있게 값을 받는다.
 *
 * 사파리 26은 사용자 에이전트의 iOS 버전을 18에 묶어 두었다. OS 버전으로는 새 메뉴를 가릴 수 없어서
 * 사파리 자신의 버전(Version/26)을 본다.
 */
export function detectInstallEnv(ua: string, touchPoints: number, standalone: boolean): InstallEnv {
  if (standalone) return { kind: 'installed' };

  if (isApple(ua, touchPoints)) {
    const app = findInApp(ua);
    // 앱 안 브라우저는 사파리 버전을 달지 않아서 OS 버전을 본다. 앱 웹뷰의 OS 버전은 묶여 있지 않다
    const iosVersion = Number(/OS (\d+)_/.exec(ua)?.[1] ?? 0);
    if (app) return { kind: 'in-app', app, os: 'ios', kakao: app === '카카오톡', iosVersion };

    const browser = IOS_BROWSERS.find((item) => item.pattern.test(ua))?.browser;
    if (browser) return { kind: 'ios-browser', browser };

    // 이름 모를 앱의 웹뷰는 Safari 토큰이 없다. 홈 화면에 추가할 수 없으니 앱 안 브라우저로 본다
    if (!/Safari\//.test(ua)) {
      return { kind: 'in-app', app: '이 앱', os: 'ios', kakao: false, iosVersion };
    }

    const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
    return { kind: 'ios-safari', modernMenu: version >= 26 };
  }

  if (/Android/.test(ua)) {
    const app = findInApp(ua);
    if (app) return { kind: 'in-app', app, os: 'android', kakao: app === '카카오톡', iosVersion: 0 };
    // 안드로이드 웹뷰는 "; wv)"를 단다. 앱 이름은 알 수 없다
    if (/; wv\)/.test(ua)) {
      return { kind: 'in-app', app: '이 앱', os: 'android', kakao: false, iosVersion: 0 };
    }

    if (/SamsungBrowser/.test(ua)) return { kind: 'android-samsung' };
    const browser = ANDROID_BROWSERS.find((item) => item.pattern.test(ua))?.browser;
    if (browser) return { kind: 'android-browser', browser };
    if (/Chrome\//.test(ua)) return { kind: 'android-chrome' };
    return { kind: 'android-browser', browser: '이 브라우저' };
  }

  return { kind: 'desktop' };
}

/** 폰과 태블릿인지. 홈 화면 안내를 먼저 띄울지 정한다. */
export function isMobileEnv(env: InstallEnv): boolean {
  return env.kind !== 'installed' && env.kind !== 'desktop';
}

/** 앱의 첫 화면 주소. 지금 보고 있는 주소가 아니라 시작 주소를 넘겨야 설치된 앱이 첫 화면부터 열린다. */
export function appStartUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

/**
 * 앱 안 브라우저에서 바깥 브라우저로 넘기는 주소. 넘길 길이 없으면 null.
 *
 * - 카카오톡은 자체 주소 형식으로 기본 브라우저를 연다(아이폰과 안드로이드 모두).
 * - 안드로이드의 다른 앱은 intent 주소로 크롬을 부른다. 패키지를 비워 기본 브라우저에 맡기면
 *   앱이 그 intent를 자기 웹뷰로 다시 여는 경우가 있어서, 가장 널리 되는 크롬 지정을 쓴다.
 *   fallback 주소는 달지 않는다. 크롬이 없을 때 같은 페이지를 앱 안에서 다시 열어 넘기기를 되풀이한다.
 * - 아이폰의 다른 앱(인스타그램)은 iOS 17부터 x-safari- 주소로 사파리를 부를 수 있다.
 *   앱이 막으면 아무 일도 없고 지금 페이지가 그대로 남는다. 그 아래 버전은 길이 없다.
 */
export function externalOpenUrl(env: InstallEnv, url: string): string | null {
  if (env.kind !== 'in-app') return null;
  if (env.kakao) return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  const target = new URL(url);
  if (env.os === 'android') {
    const path = `${target.host}${target.pathname}${target.search}`;
    return `intent://${path}#Intent;scheme=${target.protocol.replace(':', '')};package=com.android.chrome;end`;
  }
  if (env.iosVersion >= 17 && /^https?:$/.test(target.protocol)) return `x-safari-${target.href}`;
  return null;
}

/** 바깥 브라우저 버튼의 이름. 어디로 열리는지가 보여야 누른다. */
export function externalOpenLabel(env: InstallEnv): string {
  if (env.kind === 'in-app' && env.kakao) return '기본 브라우저로 열기';
  return env.kind === 'in-app' && env.os === 'ios' ? '사파리로 열기' : '크롬으로 열기';
}
