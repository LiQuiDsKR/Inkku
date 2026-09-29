/**
 * 외부 공개 에셋을 받아 public/assets/packs에 팩으로 쓴다.
 *
 *   node scripts/assets/import-assets.mjs            전체
 *   node scripts/assets/import-assets.mjs noto doodle 일부만
 *
 * 받는 대상은 저작권상 앱에 넣어 배포해도 되는 것만이다(CC0, MIT, Apache 2.0).
 * 저작자 표시가 필요한 CC BY와 같은 조건을 이어 받아야 하는 CC BY-SA는 넣지 않는다.
 * MIT와 Apache는 라이선스 원문을 함께 배포해야 해서 팩마다 LICENSE.txt를 둔다.
 * 새 팩을 넣기 전에 라이선스를 원본 저장소에서 직접 확인한다. 모음 사이트의 표기가 틀린 경우가 있다.
 */

import { importDoodleIcons } from './sources/doodle.mjs';
import { importIconifySet } from './sources/iconify.mjs';
import { importOpenclipart } from './sources/openclipart.mjs';

const NOTO_LICENSES = [
  'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/LICENSE',
  'https://www.apache.org/licenses/LICENSE-2.0.txt',
];

const JOBS = {
  'fluent-flat': () =>
    importIconifySet({
      prefix: 'fluent-emoji-flat',
      pack: { id: 'fluent-flat', label: 'Fluent Emoji Flat (Microsoft)', license: 'MIT', tintable: false },
      licenseUrls: ['https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/LICENSE'],
    }),
  // 저장소 루트 라이선스는 OFL 1.1이고 README는 그림을 Apache 2.0이라 적는다. 둘 다 싣는다
  noto: () =>
    importIconifySet({
      prefix: 'noto',
      pack: { id: 'noto', label: 'Noto Emoji (Google)', license: 'Apache-2.0 / OFL-1.1', tintable: false },
      licenseUrls: NOTO_LICENSES,
    }),
  'noto-blob': () =>
    importIconifySet({
      prefix: 'noto-v1',
      pack: { id: 'noto-blob', label: 'Noto Emoji v1 (Google)', license: 'Apache-2.0', tintable: false },
      licenseUrls: NOTO_LICENSES,
    }),
  // 선만 있는 것과 채운 것이 한 벌씩 있다. 사진 위에서는 채운 쪽만 읽힌다
  meteocons: () =>
    importIconifySet({
      prefix: 'meteocons',
      pack: { id: 'meteocons', label: 'Meteocons (Bas Milius)', license: 'MIT', tintable: false },
      licenseUrls: ['https://raw.githubusercontent.com/basmilius/weather-icons/dev/LICENSE'],
      keep: (name) => name.endsWith('-fill'),
      emoji: false,
    }),
  doodle: () => importDoodleIcons({ id: 'doodle', label: 'Doodle Icons (Khushmeen Sidhu)', license: 'CC0-1.0', tintable: true }),
  openclipart: () => importOpenclipart({ id: 'openclipart', label: 'Openclipart', license: 'CC0-1.0', tintable: false }),
};

const wanted = process.argv.slice(2);
const unknown = wanted.filter((name) => !(name in JOBS));
if (unknown.length > 0) {
  console.error(`모르는 팩: ${unknown.join(', ')}. 가능한 팩: ${Object.keys(JOBS).join(', ')}`);
  process.exit(1);
}

for (const name of wanted.length > 0 ? wanted : Object.keys(JOBS)) {
  await JOBS[name]();
}
