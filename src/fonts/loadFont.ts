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
 * 한글 폰트는 한 벌이 통으로 오고 조선궁서체는 3.5MB라, 넉넉하지 않으면 LTE에서 매번 끊긴다.
 */
const LOAD_TIMEOUT = 15000;

/** 한 폰트를 두 번 받지 않도록 진행 중인 약속을 들고 있는다. */
const loading = new Map<string, Promise<void>>();
const links = new Map<string, HTMLLinkElement>();

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

/** 크기 단위가 없으면 SyntaxError가 난다. 값은 측정용이라 실제 크기와 달라도 된다. */
function fontSpec(font: FontOption): string {
  return `${font.weight} ${PROBE_SIZE}px "${font.name}"`;
}

/**
 * 파일 하나를 @font-face로 등록한다.
 *
 * <style>에 규칙을 적어 넣지 않고 FontFace로 만드는 이유는, 규칙을 적는 것만으로는
 * 아무 일도 일어나지 않아서 "언제 받아졌는지"를 다시 물어봐야 하기 때문이다.
 * FontFace의 load()는 파일을 실제로 받아 오고 그 시점을 약속으로 알려준다.
 */
async function loadFace(font: FontOption): Promise<void> {
  if (!font.file) return;

  const face = new FontFace(font.name, `url(${font.file.url}) format('${font.file.format}')`, {
    weight: String(font.weight),
    display: 'swap',
  });

  document.fonts.add(await face.load());
}

/**
 * @font-face가 이미 들어 있는 CSS를 붙이고 그 안의 파일까지 받는다.
 * 규칙이 문서에 없으면 document.fonts.load는 "받을 것이 없다"며 즉시 끝나므로
 * 스타일시트가 붙는 것을 먼저 기다려야 한다.
 */
async function loadFromStylesheet(font: FontOption, sample: string): Promise<void> {
  if (!font.stylesheet) return;

  let link = links.get(font.id);

  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.stylesheet;
    document.head.appendChild(link);
    links.set(font.id, link);

    const element = link;
    await new Promise<void>((resolve, reject) => {
      element.addEventListener('load', () => resolve(), { once: true });
      element.addEventListener(
        'error',
        () => reject(new Error(`폰트 스타일시트를 받지 못했다: ${font.label}`)),
        { once: true },
      );
    });
  }

  const faces = await document.fonts.load(fontSpec(font), sample);
  if (faces.length === 0) throw new Error(`스타일시트에 폰트가 없다: ${font.label}`);
}

/**
 * 폰트를 실제로 쓸 수 있는 상태로 만든다.
 * 성공 여부를 돌려주지만 실패해도 앱은 폴백 폰트로 계속 동작한다.
 * 지하철에서 네트워크가 끊겼다고 글자를 못 넣게 만들 이유가 없다.
 */
export async function ensureFont(fontId: string, sample: string): Promise<boolean> {
  const font = findFont(fontId);
  if (!font.file && !font.stylesheet) return true;

  // 끝난 약속을 다시 기다리는 것은 공짜다. document.fonts.check로 건너뛰지 않는 이유는
  // 등록조차 안 된 이름도 폴백으로 그릴 수 있으면 true가 나와서, 영영 안 받게 되기 때문이다.
  const started =
    loading.get(font.id) ??
    withTimeout(
      font.file ? loadFace(font) : loadFromStylesheet(font, sample),
      `폰트 응답이 없다: ${font.label}`,
    );
  loading.set(font.id, started);

  try {
    await started;
    return true;
  } catch (error: unknown) {
    // 실패를 캐시에 남기면 네트워크가 돌아와도 다시 시도하지 않는다
    loading.delete(font.id);
    logDebug(error instanceof Error ? error.message : String(error));
    return false;
  }
}
