/**
 * SVG 정리와 크기 맞추기.
 *
 * 외부 SVG는 편집기 흔적(메타데이터, 네임스페이스 속성)과 제각각인 크기 표기를 달고 온다.
 * 의존성을 늘리지 않으려고 정규식으로 필요한 만큼만 다듬는다. 완벽한 최적화가 목적이 아니라
 * "브라우저 img와 캔버스에서 같은 모양으로, 같은 크기 규칙으로 그려지는 것"이 목적이다.
 */

/**
 * 모든 에셋의 긴 변을 이 크기로 맞춘다.
 * iOS 사파리는 SVG를 캔버스에 그릴 때 선언된 크기로 한 번 굽고 늘린다. 32짜리 이모지를
 * 그대로 두면 캔버스에서 흐려진다. 너무 크면 스티커마다 디코딩 메모리가 커진다.
 */
export const INTRINSIC_LONG_SIDE = 512;

const UNIT_TO_PX = { px: 1, pt: 96 / 72, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };

/** 따옴표 두 종류를 다 받는 속성 파서. */
export function parseAttributes(source) {
  const attributes = new Map();
  for (const match of source.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    attributes.set(match[1], match[3] ?? match[4] ?? '');
  }
  return attributes;
}

/** "210mm" 같은 길이를 px로. 퍼센트처럼 절대 크기로 못 바꾸는 값은 null이다. */
export function lengthToPx(value) {
  if (!value) return null;
  const match = /^\s*([\d.]+)\s*(px|pt|pc|mm|cm|in)?\s*$/.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) && number > 0 ? number * UNIT_TO_PX[match[2] ?? 'px'] : null;
}

/** 편집기 흔적과 실행될 수 있는 것을 걷어 낸다. img로 그리면 스크립트는 돌지 않지만 남길 이유도 없다. */
export function cleanSvg(text) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // 닫는 태그를 "</metadata\n>"처럼 줄을 바꿔 쓰는 편집기가 있다. 닫는 꺾쇠 앞 공백을 허용한다
    .replace(/<metadata\b[^>]*\/>/gi, '')
    .replace(/<metadata\b[\s\S]*?<\/metadata\s*>/gi, '')
    .replace(/<sodipodi:namedview\b[^>]*\/>/gi, '')
    .replace(/<sodipodi:namedview\b[\s\S]*?<\/sodipodi:namedview\s*>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<title\b[\s\S]*?<\/title\s*>/gi, '')
    .replace(/<desc\b[\s\S]*?<\/desc\s*>/gi, '')
    // 편집기 전용 요소는 <metadata> 밖에도 흩어져 있다. 선언을 지우기 전에 요소부터 통째로 지운다
    .replace(/<(rdf|cc|dc|inkscape|sodipodi):[\w.-]+\b[^>]*\/>/gi, '')
    .replace(/<(rdf|cc|dc|inkscape|sodipodi):([\w.-]+)\b[\s\S]*?<\/\1:\2\s*>/gi, '')
    .replace(/\s(inkscape|sodipodi):[\w.-]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\sxmlns:(inkscape|sodipodi|rdf|cc|dc)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * 선언되지 않은 접두사가 남아 있는지.
 * 하나라도 있으면 XML이 깨져서 img가 파일 전체를 거부한다(빈 칸으로 보인다).
 * 정리 규칙이 모든 편집기를 알 수는 없으니, 남은 것은 싣지 않고 걸러 낸다.
 */
export function hasUndeclaredPrefix(svg) {
  const used = new Set();
  for (const match of svg.matchAll(/<\/?([A-Za-z_][\w.-]*):[\w.-]+/g)) used.add(match[1]);
  for (const match of svg.matchAll(/\s([A-Za-z_][\w.-]*):[\w.-]+\s*=/g)) used.add(match[1]);
  used.delete('xml');
  used.delete('xmlns');
  return [...used].some((prefix) => !svg.includes(`xmlns:${prefix}=`));
}

/**
 * 애니메이션 태그를 뺀다.
 * 캔버스에 그리는 순간의 프레임이 찍히는데, 나타나는 애니메이션은 첫 프레임이 투명이라
 * 스티커가 빈 칸으로 놓인다. 태그를 빼면 요소의 기본 속성, 즉 멈춘 모양이 남는다.
 */
export function stripAnimation(svg) {
  return svg
    .replace(/<animate(Transform|Motion)?\b[^>]*\/>/gi, '')
    .replace(/<animate(Transform|Motion)?\b[\s\S]*?<\/animate(Transform|Motion)?>/gi, '')
    .replace(/<set\b[^>]*\/>/gi, '');
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

/** 긴 변을 INTRINSIC_LONG_SIDE로 맞춘 선언 크기. */
export function intrinsicSize(boxWidth, boxHeight) {
  const scale = INTRINSIC_LONG_SIDE / Math.max(boxWidth, boxHeight);
  return { width: Math.round(boxWidth * scale), height: Math.round(boxHeight * scale) };
}

const DROP_ROOT_ATTRIBUTES = new Set([
  'width', 'height', 'viewBox', 'x', 'y', 'id', 'version', 'enable-background', 'xml:space', 'style',
]);

/**
 * 뿌리 svg 태그를 다시 쓴다. viewBox를 정하고 선언 크기를 맞춘다.
 * box를 주면 그 영역만 보이게 자른다(그림 둘레의 빈 페이지를 걷어 낼 때 쓴다).
 * 크기를 알 수 없는 파일이면 null이다.
 */
export function normalizeRoot(svg, box) {
  const open = /<svg\b([^>]*)>/i.exec(svg);
  if (!open) return null;
  const attributes = parseAttributes(open[1]);

  let viewBox = box ?? null;
  if (!viewBox && attributes.has('viewBox')) {
    const numbers = attributes.get('viewBox').trim().split(/[\s,]+/).map(Number);
    if (numbers.length === 4 && numbers.every(Number.isFinite) && numbers[2] > 0 && numbers[3] > 0) {
      viewBox = numbers;
    }
  }
  if (!viewBox) {
    const width = lengthToPx(attributes.get('width'));
    const height = lengthToPx(attributes.get('height'));
    if (!width || !height) return null;
    viewBox = [0, 0, width, height];
  }

  const size = intrinsicSize(viewBox[2], viewBox[3]);
  const kept = [...attributes.entries()]
    .filter(([name]) => !DROP_ROOT_ATTRIBUTES.has(name))
    .map(([name, value]) => `${name}="${value.replace(/"/g, '&quot;')}"`);
  if (!attributes.has('xmlns')) kept.unshift('xmlns="http://www.w3.org/2000/svg"');
  // xlink:href를 쓰는데 선언이 없는 파일이 있다. 선언이 없으면 img가 파일 전체를 거부한다
  if (/xlink:href/.test(svg) && !attributes.has('xmlns:xlink')) {
    kept.push('xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const root =
    `<svg ${kept.join(' ')} width="${size.width}" height="${size.height}" ` +
    `viewBox="${viewBox.map(round).join(' ')}">`;
  return { svg: svg.slice(0, open.index) + root + svg.slice(open.index + open[0].length), ...size };
}

/**
 * 한 가지 색으로만 그린 그림의 검정을 currentColor로 바꾼다.
 * img로 보면 여전히 검정이지만(기본 글자색), 앱이 이 단어를 원하는 색으로 바꿔 끼워 색을 입힌다.
 */
export function blackToCurrentColor(svg) {
  return svg.replace(
    /(fill|stroke)\s*=\s*"(black|#000|#000000)"/gi,
    (_, attribute) => `${attribute}="currentColor"`,
  );
}
