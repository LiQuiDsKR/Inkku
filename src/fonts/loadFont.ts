import { findFont, type FontOption } from './catalog';
import { logDebug } from '@/utils/debugLog';

/**
 * 폰트 동적 로딩.
 *
 * 캔버스는 폰트가 준비되기 전에 그리면 폴백 폰트로 그려 놓고 끝이다.
 * CSS와 달리 나중에 폰트가 도착해도 저절로 다시 그려지지 않으므로,
 * 로드 완료를 기다렸다가 캔버스에 다시 그리라고 알려야 한다.
 */

/** 측정용 크기. 실제 크기와 달라도 되지만 같은 값을 계속 써야 캐시가 맞는다. */
const PROBE_SIZE = 64;

/**
 * 응답을 기다리는 한계 시간.
 * 지하철이나 기내에서는 요청이 실패하지 않고 그냥 매달린다.
 * 시간을 끊지 않으면 약속이 영원히 안 끝나서 다시 시도할 기회도 없다.
 */
const LOAD_TIMEOUT = 6000;

/** 한글 웹폰트는 유니코드 구간별로 쪼개져 있어서, 실제로 쓸 글자를 넘겨야 그 조각을 받는다. */
const BASE_SAMPLE = '가나다라마바사아자차카타파하';

const stylesheets = new Map<string, Promise<void>>();
const links = new Map<string, HTMLLinkElement>();

function stylesheetUrl(font: FontOption): string {
  return `https://fonts.googleapis.com/css2?family=${font.googleFamily ?? ''}&display=swap`;
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), LOAD_TIMEOUT);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * @font-face 규칙이 문서에 없으면 document.fonts.load는 "받을 것이 없다"며 즉시 끝난다.
 * 그래서 스타일시트가 붙는 것을 먼저 기다려야 한다.
 */
function ensureStylesheet(font: FontOption): Promise<void> {
  const cached = stylesheets.get(font.id);
  if (cached) return cached;

  let link = links.get(font.id);
  // 이미 다 받은 link에 다시 load 리스너를 걸면 이벤트가 지나간 뒤라 영영 오지 않는다.
  // 크로스 오리진이어도 sheet가 채워졌는지는 볼 수 있다.
  if (link?.sheet) return Promise.resolve();

  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheetUrl(font);
    document.head.appendChild(link);
    links.set(font.id, link);
  }

  const element = link;
  const promise = new Promise<void>((resolve, reject) => {
    element.addEventListener('load', () => resolve(), { once: true });
    element.addEventListener(
      'error',
      () => reject(new Error(`폰트 스타일시트를 받지 못했다: ${font.label}`)),
      { once: true },
    );
  });

  stylesheets.set(font.id, promise);
  return promise;
}

/**
 * 폰트를 실제로 쓸 수 있는 상태로 만든다.
 * 성공 여부를 돌려주지만 실패해도 앱은 폴백 폰트로 계속 동작한다.
 * 지하철에서 네트워크가 끊겼다고 글자를 못 넣게 만들 이유가 없다.
 */
export async function ensureFont(fontId: string, sample: string): Promise<boolean> {
  const font = findFont(fontId);
  if (!font.googleFamily) return true;

  try {
    await withTimeout(ensureStylesheet(font), `폰트 스타일시트 응답이 없다: ${font.label}`);
    // 폰트 스펙 문자열의 크기 단위는 반드시 있어야 한다. 없으면 SyntaxError가 난다.
    const spec = `${font.weight} ${PROBE_SIZE}px ${font.family}`;
    const faces = await withTimeout(
      document.fonts.load(spec, sample + BASE_SAMPLE),
      `폰트 파일 응답이 없다: ${font.label}`,
    );
    // check()는 폴백으로 그릴 수 있으면 true라 신뢰할 수 없다. 실제로 잡힌 face 수를 본다.
    return faces.length > 0;
  } catch (error: unknown) {
    // 실패를 캐시에 남기면 네트워크가 돌아와도 다시 시도하지 않는다
    stylesheets.delete(font.id);
    logDebug(error instanceof Error ? error.message : String(error));
    return false;
  }
}
