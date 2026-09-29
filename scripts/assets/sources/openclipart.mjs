import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cachedFetch, mapLimit, toLabel, writePack } from '../lib/io.mjs';
import { cleanSvg, hasUndeclaredPrefix, normalizeRoot } from '../lib/svg.mjs';

/**
 * Openclipart (전부 CC0).
 *
 * 말풍선, 구분선, 프레임처럼 이모지 세트에 없는 것을 여기서 채운다.
 * 품질이 들쭉날쭉해서 검색 결과를 통째로 받지 않는다. 사람이 눈으로 고른 목록
 * (openclipart-picks.json)만 받는다. 캐릭터, 로고, 국기, 글자가 박힌 것, 배경까지 그려진 것은 뺐다.
 *
 * 목록의 box는 그림이 실제로 차지하는 영역이다. 원본은 A4 페이지 한가운데에 작은 그림이 놓인
 * 경우가 많아서, 그대로 두면 스티커의 선택 상자가 그림보다 훨씬 커진다.
 * 브라우저로 잰 값을 목록에 적어 두고 여기서는 그 값으로 자르기만 한다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PICKS_PATH = join(HERE, '..', 'openclipart-picks.json');

const GROUPS = [
  { id: 'bubble', label: '말풍선' },
  { id: 'cute', label: '귀여운' },
  { id: 'heart', label: '하트' },
  { id: 'ribbon', label: '리본' },
  { id: 'crown', label: '왕관' },
  { id: 'banner', label: '배너' },
  { id: 'frame', label: '프레임' },
  { id: 'ornament', label: '장식' },
  { id: 'line', label: '구분선' },
  { id: 'scribble', label: '손그림' },
];

const LICENSE = `Openclipart
원본: https://openclipart.org
이 폴더의 SVG는 원본에서 편집기 흔적을 걷어 내고, 그림 둘레의 빈 페이지를 잘라 크기를 맞춘 것이다.
파일 이름의 숫자가 Openclipart의 작품 번호다(https://openclipart.org/detail/<번호>).

Openclipart의 모든 그림은 Creative Commons Zero 1.0 (CC0 1.0 Universal)으로 공개되어 있다.
저작자 표시 없이 상업적 용도를 포함해 자유롭게 쓸 수 있다.
https://openclipart.org/share
https://creativecommons.org/publicdomain/zero/1.0/legalcode
`;

export async function importOpenclipart(pack) {
  const picks = JSON.parse(readFileSync(PICKS_PATH, 'utf8'));

  // 느린 서버다. 동시에 너무 많이 두드리지 않는다
  const items = await mapLimit(picks, 4, async (pick) => {
    const raw = (await cachedFetch(`https://openclipart.org/download/${pick.id}`, `openclipart/${pick.id}.svg`)).toString(
      'utf8',
    );
    if (/<image[\s>]/.test(raw)) return null;
    const normalized = normalizeRoot(cleanSvg(raw), pick.box);
    if (!normalized) {
      console.log(`openclipart ${pick.id}: 크기를 알 수 없어 건너뜀`);
      return null;
    }
    if (hasUndeclaredPrefix(normalized.svg)) {
      console.log(`openclipart ${pick.id}: 선언되지 않은 접두사가 남아 건너뜀`);
      return null;
    }
    return {
      id: `oc-${pick.id}`,
      label: toLabel(pick.slug),
      group: pick.group,
      svg: normalized.svg,
      width: normalized.width,
      height: normalized.height,
    };
  });

  writePack(pack, items.filter(Boolean), GROUPS, LICENSE);
}
