import { useEffect, useState } from 'react';
import Icon from './icons/Icon';
import InstallGuideSheet from './InstallGuideSheet';
import { useAppMode } from './useAppMode';
import { enterFullscreen, exitFullscreen, isStandalone } from '@/utils/appMode';
import { detectInstallEnv, isMobileEnv } from '@/utils/installEnv';

/**
 * 홈 화면 오른쪽 위의 전체 화면 버튼.
 * 이 브라우저가 전체 화면을 허락하지 않으면(아이폰) 아예 그리지 않는다. 눌러도 아무 일이 없는 버튼은 고장으로 보인다.
 */
export function FullscreenToggle() {
  const { fullscreenSupported, fullscreen } = useAppMode();
  if (!fullscreenSupported) return null;

  return (
    <button
      type="button"
      onClick={() => void (fullscreen ? exitFullscreen() : enterFullscreen())}
      aria-label={fullscreen ? '전체 화면 나가기' : '전체 화면'}
      title={fullscreen ? '전체 화면 나가기' : '전체 화면'}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-on-surface transition-transform active:scale-90"
    >
      <Icon name={fullscreen ? 'shrink' : 'expand'} size={18} />
    </button>
  );
}

/**
 * 홈 화면 안내를 이번 페이지에서 이미 보여 줬는지.
 * 편집하다 홈으로 돌아올 때마다 다시 뜨면 성가시다. 새로 열면(새로고침, 다음 방문) 다시 보여 준다.
 * 브라우저로 여는 동안은 매번 권한다. 홈 화면에 두지 않으면 주소창과 당겨서 새로고침이 계속 끼어든다.
 */
let autoShown = false;

/**
 * "앱처럼 쓰기" 카드. 홈 화면에 추가하면 주소창 없이 열리고 당겨서 새로고침도 사라진다.
 *
 * 폰에서 브라우저로 열었으면 홈 화면이 뜨자마자 안내 시트를 한 번 올린다. 카드만 두면 대부분 지나친다.
 * PC는 설치 창을 띄울 수 있을 때(크롬, 엣지)만 카드를 보이고 시트는 먼저 띄우지 않는다.
 */
export function InstallCard() {
  const { standalone, install } = useAppMode();
  const [env] = useState(() =>
    detectInstallEnv(navigator.userAgent, navigator.maxTouchPoints, isStandalone()),
  );
  const mobile = isMobileEnv(env);
  const [guide, setGuide] = useState(() => mobile && !autoShown);

  useEffect(() => {
    if (guide) autoShown = true;
  }, [guide]);

  if (standalone || (!mobile && !install)) return null;

  return (
    <>
      <section className="mt-4 flex items-center gap-3 rounded-3xl bg-surface-container p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-tertiary">
          <Icon name="addBox" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title-md text-on-surface">앱처럼 쓰기</p>
          <p className="text-body-md text-on-surface-variant">
            {mobile ? '홈 화면에 두면 주소창 없이 꽉 찬 화면으로 열린다' : 'PC에 설치하면 따로 된 창으로 열린다'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (mobile ? setGuide(true) : void install?.())}
          className="shrink-0 rounded-full bg-primary-container px-4 py-2.5 text-label-lg text-on-primary-container transition-transform active:scale-95"
        >
          {mobile ? '추가하기' : '설치'}
        </button>
      </section>
      {guide && <InstallGuideSheet env={env} onClose={() => setGuide(false)} />}
    </>
  );
}
