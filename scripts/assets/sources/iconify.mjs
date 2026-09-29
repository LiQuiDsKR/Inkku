import { cachedFetch, toFileId, toLabel, writePack } from '../lib/io.mjs';
import { intrinsicSize, stripAnimation } from '../lib/svg.mjs';

/**
 * Iconify 묶음(JSON 한 파일에 세트 전체)에서 팩을 만든다.
 *
 * 세트마다 저장소 구조가 제각각이라 원본 저장소를 직접 긁으면 세트마다 코드를 따로 써야 한다.
 * Iconify는 수백 개 세트를 같은 형식으로 정리해 두고 세트별 라이선스까지 적어 두어서,
 * 한 경로로 여러 세트를 받을 수 있다. 라이선스는 여기 적힌 값을 믿지 않고 원본 저장소에서 확인했다
 * (Firefox 이모지는 Iconify에 Apache로 적혀 있지만 그림은 CC BY 4.0이라 뺐다).
 */

/** 커밋을 고정한다. 원본이 바뀌어도 다시 돌렸을 때 같은 결과가 나와야 한다. */
const ICON_SETS_URL =
  'https://raw.githubusercontent.com/iconify/icon-sets/7552d0b10672d46f76069fc5f8c753af2e1baba4/json';

/** 이모지 분류를 한국어 묶음으로. 세트마다 이름이 조금씩 달라 여러 이름이 같은 묶음을 가리킨다. */
const EMOJI_GROUPS = [
  { id: 'face', label: '표정', sources: ['Smileys & Emotion'] },
  { id: 'people', label: '사람', sources: ['People & Body', 'People'] },
  { id: 'nature', label: '동물·자연', sources: ['Animals & Nature', 'Nature'] },
  { id: 'food', label: '음식', sources: ['Food & Drink'] },
  { id: 'activity', label: '활동', sources: ['Activities'] },
  { id: 'travel', label: '여행·장소', sources: ['Travel & Places', 'Places'] },
  { id: 'object', label: '사물', sources: ['Objects'] },
  { id: 'symbol', label: '기호', sources: ['Symbols'] },
  { id: 'flag', label: '깃발', sources: ['Flags'] },
  { id: 'etc', label: '기타', sources: [] },
];

const EMOJI_TEST_URL = 'https://unicode.org/Public/emoji/16.0/emoji-test.txt';

const SKIN_TONES = ['medium-light', 'medium-dark', 'light', 'medium', 'dark'];

/**
 * 피부색 변형인지.
 * 같은 그림이 다섯 벌씩 있으면 목록이 다섯 배로 길어지고 고르기만 어려워진다.
 * 뒤에 붙은 피부색 단어를 떼었을 때 원래 이름이 세트에 있을 때만 변형으로 본다.
 * "traffic-light"처럼 우연히 같은 단어로 끝나는 이름을 지우지 않기 위해서다.
 */
function isSkinToneVariant(name, names) {
  if (/skin-tone/.test(name)) return true;
  let base = name;
  for (;;) {
    const tone = SKIN_TONES.find((item) => base.endsWith(`-${item}`));
    if (!tone) return false;
    base = base.slice(0, -(tone.length + 1));
    if (names.has(base)) return true;
  }
}

/**
 * 유니코드가 정한 이모지 순서. 이름(소문자, 하이픈)에서 순번으로.
 * Iconify는 알파벳순이라 표정 묶음 맨 앞에 외계인이 온다. 휴대폰 키보드와 같은 순서(웃는 얼굴부터)여야
 * 찾던 것이 있을 자리에 있다. 정렬에만 쓰고 앱에 싣지 않는다.
 */
async function emojiOrder() {
  const text = (await cachedFetch(EMOJI_TEST_URL, 'unicode/emoji-test.txt')).toString('utf8');
  const order = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /; fully-qualified\s+#\s+\S+\s+E\d+\.\d+\s+(.+)$/.exec(line);
    if (match) order.set(toFileId(match[1]), order.size);
  }
  return order;
}

function groupOf(name, categories) {
  for (const group of EMOJI_GROUPS) {
    if (group.sources.some((source) => categories[source]?.includes(name))) return group.id;
  }
  return 'etc';
}

/**
 * @param {object} options
 * @param {string} options.prefix Iconify 세트 이름
 * @param {object} options.pack index.json 머리 정보
 * @param {string[]} options.licenseUrls 함께 배포할 라이선스 원문 주소
 * @param {(name: string) => boolean} [options.keep] 더 거를 조건
 * @param {boolean} [options.emoji] 이모지 분류를 쓸지
 */
export async function importIconifySet({ prefix, pack, licenseUrls, keep, emoji = true }) {
  const set = JSON.parse((await cachedFetch(`${ICON_SETS_URL}/${prefix}.json`, `iconify/${prefix}.json`)).toString('utf8'));
  const names = new Set(Object.keys(set.icons));
  const categories = set.categories ?? {};
  const items = [];
  let skipped = 0;

  for (const [name, icon] of Object.entries(set.icons)) {
    if (icon.hidden || isSkinToneVariant(name, names) || (keep && !keep(name))) continue;
    // 돌리거나 뒤집은 아이콘은 변환을 따로 풀어야 한다. 이모지 세트에는 거의 없어서 건너뛴다
    if (icon.rotate || icon.hFlip || icon.vFlip) {
      skipped += 1;
      continue;
    }

    const left = icon.left ?? set.left ?? 0;
    const top = icon.top ?? set.top ?? 0;
    const boxWidth = icon.width ?? set.width ?? 16;
    const boxHeight = icon.height ?? set.height ?? 16;
    const size = intrinsicSize(boxWidth, boxHeight);
    const body = stripAnimation(icon.body);
    const xlink = body.includes('xlink:') ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : '';

    items.push({
      id: toFileId(name),
      label: toLabel(name),
      group: emoji ? groupOf(name, categories) : 'all',
      width: size.width,
      height: size.height,
      svg:
        `<svg xmlns="http://www.w3.org/2000/svg"${xlink} width="${size.width}" height="${size.height}" ` +
        `viewBox="${left} ${top} ${boxWidth} ${boxHeight}">${body}</svg>`,
    });
  }

  if (skipped > 0) console.log(`${prefix}: 변환이 걸린 ${skipped}개 건너뜀`);

  if (emoji) {
    const order = await emojiOrder();
    // 유니코드 목록에 없는 이름(세트 고유 그림)은 뒤로 보낸다
    const rank = (item) => order.get(item.id) ?? Number.MAX_SAFE_INTEGER;
    items.sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  }

  const licenses = await Promise.all(
    licenseUrls.map(async (url, index) => {
      const text = (await cachedFetch(url, `license/${prefix}-${index}.txt`)).toString('utf8');
      return `출처: ${url}\n\n${text}`;
    }),
  );

  const groups = emoji ? EMOJI_GROUPS.map(({ id, label }) => ({ id, label })) : [{ id: 'all', label: '전체' }];
  const header =
    `${pack.label}\n원본: ${set.info?.author?.url ?? ''}\n` +
    `이 폴더의 SVG는 원본을 크기만 맞추고 애니메이션 태그를 뺀 것이다.\n\n`;
  writePack(pack, items, groups, header + licenses.join('\n\n----------------------------------------\n\n'));
}
