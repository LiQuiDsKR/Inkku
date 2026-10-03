import { useState } from 'react';
import Icon from './icons/Icon';
import { useAppMode } from './useAppMode';
import { enterFullscreen, exitFullscreen, isAppleMobile } from '@/utils/appMode';

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
 * "앱처럼 쓰기" 카드. 홈 화면에 추가하면 주소창 없이 열리고 당겨서 새로고침도 사라진다.
 *
 * 안드로이드 크롬은 설치 창을 바로 띄우고, 아이폰은 사파리의 공유 메뉴를 거쳐야 해서 방법을 보여 준다.
 * 이미 홈 화면 아이콘으로 열렸거나 설치할 길이 없는 브라우저(데스크톱 일부)에서는 숨긴다.
 */
export function InstallCard() {
  const { standalone, install } = useAppMode();
  const [guide, setGuide] = useState(false);
  const apple = isAppleMobile();

  if (standalone || (!install && !apple)) return null;

  return (
    <>
      <section className="mt-4 flex items-center gap-3 rounded-3xl bg-surface-container p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-tertiary">
          <Icon name="addBox" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title-md text-on-surface">앱처럼 쓰기</p>
          <p className="text-body-md text-on-surface-variant">홈 화면에 두면 주소창 없이 꽉 찬 화면으로 열린다</p>
        </div>
        <button
          type="button"
          onClick={() => (install ? void install() : setGuide(true))}
          className="shrink-0 rounded-full bg-primary-container px-4 py-2.5 text-label-lg text-on-primary-container transition-transform active:scale-95"
        >
          {install ? '설치' : '방법 보기'}
        </button>
      </section>
      {guide && <AppleInstallGuide onClose={() => setGuide(false)} />}
    </>
  );
}

const APPLE_STEPS: readonly { icon: 'share' | 'addBox' | 'sparkle'; text: string }[] = [
  { icon: 'share', text: '사파리 아래쪽의 공유 버튼을 누른다' },
  { icon: 'addBox', text: '목록을 내려 "홈 화면에 추가"를 누른다' },
  { icon: 'sparkle', text: '홈 화면의 Inkku 아이콘으로 열면 앱처럼 꽉 찬 화면이 된다' },
];

/** 아이폰은 설치 창을 띄울 방법이 없다. 사파리 메뉴를 어떻게 찾아가는지 그림과 함께 알려 준다. */
function AppleInstallGuide({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="safe-bottom w-full rounded-t-3xl bg-surface-container px-5 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">홈 화면에 추가하기</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-high text-on-surface-variant"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          {APPLE_STEPS.map((step, index) => (
            <li key={step.text} className="flex items-center gap-3 rounded-2xl bg-surface-high p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-bright text-primary">
                <Icon name={step.icon} size={18} />
              </span>
              <span className="text-body-lg text-on-surface">
                <span className="mr-1 text-tertiary">{index + 1}.</span>
                {step.text}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-label-md text-muted">
          아이폰 사파리는 웹 페이지의 전체 화면을 허락하지 않아서 이 방법만 된다
        </p>
      </div>
    </div>
  );
}
