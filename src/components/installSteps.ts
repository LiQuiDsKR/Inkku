import type { IconName } from './icons/paths';
import type { InstallEnv } from '@/utils/installEnv';

export interface InstallStep {
  icon: IconName;
  text: string;
}

export interface InstallGuide {
  /** 시트 위쪽의 한 줄. 무엇을 할지가 아니라 지금 어디에 있는지부터 알려 준다. */
  lead: string;
  steps: readonly InstallStep[];
  /** 끝에 붙는 작은 글씨. 안 될 때의 다음 길. */
  note?: string;
}

/**
 * 브라우저별 홈 화면 추가 순서.
 *
 * 버튼 이름은 그 브라우저가 한국어로 실제로 적는 낱말을 따옴표에 넣어 그대로 쓴다.
 * 사람은 설명이 아니라 글자를 보고 찾는다. 아이콘도 그 버튼의 생김새를 따른다.
 */
export function installGuideFor(env: InstallEnv): InstallGuide | null {
  switch (env.kind) {
    case 'installed':
      return null;

    case 'ios-safari':
      return {
        lead: '아이폰은 사파리 메뉴에서 직접 추가해야 한다',
        steps: env.modernMenu
          ? [
              { icon: 'moreHoriz', text: '주소창 오른쪽의 점 세 개(···) 버튼을 누른다' },
              { icon: 'share', text: '"공유"를 누른다' },
              { icon: 'addBox', text: '목록을 내려 "홈 화면에 추가"를 누른다' },
              { icon: 'check', text: '"웹 앱으로 열기"가 켜져 있는지 보고 "추가"를 누른다' },
            ]
          : [
              { icon: 'share', text: '아래쪽의 공유 버튼(네모에서 화살표가 나오는 모양)을 누른다' },
              { icon: 'addBox', text: '목록을 내려 "홈 화면에 추가"를 누른다' },
              { icon: 'check', text: '오른쪽 위의 "추가"를 누른다' },
            ],
        note: '아이패드는 공유 버튼이 주소창 오른쪽 위에 있다',
      };

    case 'ios-browser':
      return {
        lead: `아이폰 ${env.browser}에서도 홈 화면에 추가할 수 있다`,
        steps: [
          {
            icon: 'share',
            text:
              env.browser === '크롬'
                ? '주소창 오른쪽의 공유 버튼을 누른다'
                : '메뉴를 열어 "공유"를 누른다',
          },
          { icon: 'addBox', text: '목록을 내려 "홈 화면에 추가"를 누른다' },
          { icon: 'check', text: '"추가"를 누른다' },
        ],
        note: '목록에 "홈 화면에 추가"가 없으면 iOS가 오래된 것이다. 주소를 복사해 사파리에서 열면 된다',
      };

    case 'in-app':
      return {
        lead: `${env.app} 안의 브라우저에서는 홈 화면에 추가할 수 없다`,
        steps:
          env.app === '인스타그램' || env.app === '스레드'
            ? [
                { icon: 'moreHoriz', text: '오른쪽 위의 점 세 개(···)를 누른다' },
                {
                  icon: 'external',
                  text: `"외부 브라우저에서 열기"를 누른다(${env.os === 'ios' ? '사파리' : '크롬'}로 열린다)`,
                },
                { icon: 'addBox', text: '열린 브라우저에서 이 안내를 다시 따라 한다' },
              ]
            : [
                {
                  icon: 'external',
                  text: `아래 버튼이나 앱의 메뉴로 ${env.os === 'ios' ? '사파리' : '크롬'}에서 연다`,
                },
                { icon: 'addBox', text: '열린 브라우저에서 이 안내를 다시 따라 한다' },
              ],
        note: '메뉴를 못 찾으면 주소를 복사해 브라우저 주소창에 붙여 넣는다',
      };

    case 'android-chrome':
      return {
        lead: '크롬 메뉴에서 바로 설치할 수 있다',
        steps: [
          { icon: 'moreVert', text: '오른쪽 위의 점 세 개(⋮) 메뉴를 누른다' },
          { icon: 'addBox', text: '"홈 화면에 추가" 또는 "앱 설치"를 누른다' },
          { icon: 'check', text: '"설치"를 누른다' },
        ],
      };

    case 'android-samsung':
      return {
        lead: '삼성 인터넷 메뉴에서 추가할 수 있다',
        steps: [
          { icon: 'menu', text: '아래쪽의 줄 세 개(≡) 메뉴를 누른다' },
          { icon: 'addBox', text: '"현재 페이지 추가"를 누른다' },
          { icon: 'check', text: '"홈 화면"을 고른다' },
        ],
        note: '주소창에 설치 아이콘이 보이면 그것을 눌러도 된다',
      };

    case 'android-browser':
      return {
        lead: `${env.browser} 메뉴에서 추가할 수 있다`,
        steps: [
          { icon: 'moreVert', text: '브라우저 메뉴(⋮ 또는 ≡)를 연다' },
          { icon: 'addBox', text: '"설치", "홈 화면에 추가", "휴대폰에 추가" 중 보이는 것을 누른다' },
        ],
        note: '메뉴에 없으면 크롬에서 열면 된다',
      };

    case 'desktop':
      return {
        lead: '크롬이나 엣지는 주소창 오른쪽의 설치 아이콘으로 PC에 앱처럼 설치할 수 있다',
        steps: [],
      };
  }
}
