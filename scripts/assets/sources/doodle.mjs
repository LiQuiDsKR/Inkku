import { cachedFetch, mapLimit, toFileId, toLabel, writePack } from '../lib/io.mjs';
import { blackToCurrentColor, cleanSvg, normalizeRoot } from '../lib/svg.mjs';

/**
 * Doodle Icons (Khushmeen Sidhu, CC0).
 *
 * 한 가지 색(검정)으로만 그린 손그림이라 색을 입힐 수 있게 검정을 currentColor로 바꿔 둔다.
 * 원본은 GitHub의 theJian/doodle-icons 저장소가 icons 폴더에 분류별로 모아 둔 것을 쓴다.
 */

const REPO = 'theJian/doodle-icons';
/** 커밋을 고정한다. 원본이 바뀌어도 다시 돌렸을 때 같은 결과가 나와야 한다. */
const COMMIT = '9eebd17ec79290b03845afaa57f78f27ca2c41e4';

/** 폴더 이름을 한국어 묶음으로. 목록에 보일 순서이기도 하다. */
const GROUPS = [
  { id: 'arrows', label: '화살표' },
  { id: 'emojis', label: '표정' },
  { id: 'hand-gestures', label: '손' },
  { id: 'weather', label: '날씨' },
  { id: 'misc', label: '여러 가지' },
  { id: 'objects', label: '사물' },
  { id: 'food', label: '음식' },
  { id: 'health', label: '건강' },
  { id: 'e-commerce', label: '쇼핑' },
  { id: 'interface', label: '아이콘' },
  { id: 'files', label: '문서' },
  { id: 'finance', label: '돈' },
  { id: 'currency', label: '화폐' },
  { id: 'gender-symbols', label: '성별 기호' },
];

/**
 * 뺄 폴더. 로고는 저작권은 풀려 있어도 상표권이 따로 있다.
 * 사용자가 남의 상표를 붙여 올리게 만드는 목록을 앱이 먼저 내밀 이유가 없다.
 */
const EXCLUDED = new Set(['logos']);

export async function importDoodleIcons(pack) {
  const tree = JSON.parse(
    (
      await cachedFetch(`https://api.github.com/repos/${REPO}/git/trees/${COMMIT}?recursive=1`, 'doodle/tree.json')
    ).toString('utf8'),
  );
  const files = tree.tree
    .map((entry) => entry.path)
    .filter((path) => /^icons\/[^/]+\/[^/]+\.svg$/.test(path))
    .filter((path) => !EXCLUDED.has(path.split('/')[1]));

  const items = await mapLimit(files, 6, async (path) => {
    const [, group, file] = path.split('/');
    const raw = (
      await cachedFetch(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${path}`, `doodle/${group}/${file}`)
    ).toString('utf8');
    const normalized = normalizeRoot(blackToCurrentColor(cleanSvg(raw)));
    if (!normalized) return null;
    const name = file.replace(/\.svg$/, '');
    return {
      // 폴더가 달라도 파일 이름이 겹친다(interface/arrow와 arrows/arrow). 폴더를 앞에 붙인다
      id: toFileId(`${group}-${name}`),
      label: toLabel(name),
      group,
      svg: normalized.svg,
      width: normalized.width,
      height: normalized.height,
    };
  });

  const license = (
    await cachedFetch(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/icons/LICENSE`, 'doodle/LICENSE')
  ).toString('utf8');
  const header =
    `${pack.label}\n원본: https://github.com/${REPO} (icons/)\n` +
    `이 폴더의 SVG는 원본의 검정을 currentColor로 바꾸고 크기를 맞춘 것이다.\n\n`;
  writePack(pack, items.filter(Boolean), GROUPS, header + license);
}
