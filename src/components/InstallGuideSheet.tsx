import { useState } from 'react';
import Icon from './icons/Icon';
import { installGuideFor } from './installSteps';
import { useAppMode } from './useAppMode';
import { escapeAttempted } from '@/utils/inAppEscape';
import {
  appStartUrl,
  externalOpenLabel,
  externalOpenUrl,
  type InstallEnv,
} from '@/utils/installEnv';

interface InstallGuideSheetProps {
  env: InstallEnv;
  onClose: () => void;
}

/** 홈 화면에 두면 무엇이 달라지는지. 방법보다 이유가 먼저 보여야 귀찮은 일을 해 준다. */
const BENEFITS = ['주소창 없이 꽉 찬 화면', '아이콘 한 번에 바로 시작', '당겨도 새로고침되지 않는다'];

/**
 * 홈 화면 추가 안내 시트.
 *
 * 설치 창을 코드로 띄울 수 있으면(안드로이드 크롬) 그 버튼을 맨 위에 크게 두고,
 * 직접 하는 순서는 버튼이 안 될 때를 위해 아래에 남긴다. 크롬은 같은 사람에게 설치 창을
 * 몇 번 거절당하면 한동안 이벤트를 보내지 않아서 버튼만 두면 막다른 길이 된다.
 */
export default function InstallGuideSheet({ env, onClose }: InstallGuideSheetProps) {
  const { install, installed } = useAppMode();
  const [copied, setCopied] = useState(false);
  const guide = installGuideFor(env);
  if (!guide) return null;

  const url = appStartUrl();
  const external = externalOpenUrl(env, url);
  // 이 브라우저에서 끝낼 수 없거나 메뉴가 없을 수 있는 경우에만 주소를 들고 나가게 한다
  const showAddress =
    env.kind === 'in-app' || env.kind === 'ios-browser' || env.kind === 'android-browser';

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // 앱 안 브라우저는 클립보드를 막기도 한다. 그때는 아래 주소 칸을 꾹 눌러 복사하게 둔다
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="safe-bottom scroll-contain max-h-[92%] w-full overflow-y-auto rounded-t-3xl bg-surface-container px-5 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt=""
            className="h-12 w-12 shrink-0 rounded-2xl"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-md text-on-surface">홈 화면에 Inkku 두기</h2>
            <p className="text-body-md text-on-surface-variant">앱처럼 쓰는 가장 빠른 길</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-high text-on-surface-variant"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-1 rounded-full bg-surface-high px-2.5 py-1 text-label-md text-on-surface"
            >
              <Icon name="check" size={12} className="text-secondary" />
              {benefit}
            </li>
          ))}
        </ul>

        {installed ? (
          <p className="mt-5 rounded-2xl bg-secondary-container/15 p-4 text-body-lg text-secondary">
            설치했다. 이제 홈 화면의 Inkku 아이콘으로 열면 앱처럼 꽉 찬 화면이 된다.
          </p>
        ) : (
          <>
            {install && (
              <button
                type="button"
                onClick={() => {
                  void install();
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-3.5 text-title-md text-on-primary-container transition-transform active:scale-[0.98]"
              >
                <Icon name="download" size={18} />
                지금 설치하기
              </button>
            )}

            {/* 뜨자마자 바깥 브라우저로 넘겼는데 이 화면이 보인다면 넘기기가 막혔거나, 넘긴 뒤 앱으로 돌아온 것이다 */}
            {escapeAttempted() && (
              <p className="mt-5 rounded-2xl bg-surface-high p-3 text-body-md text-on-surface">
                바깥 브라우저로 넘겨 두었다. 새 창이 열렸으면 거기서 이어 하면 되고, 안 열렸으면 아래 순서를 따른다.
              </p>
            )}

            <p className={`text-body-md text-on-surface-variant ${install ? 'mt-4' : 'mt-5'}`}>
              {install ? '설치 창이 안 뜨면 직접 추가한다' : guide.lead}
            </p>

            {guide.steps.length > 0 && (
              <ol className="mt-2 flex flex-col gap-2">
                {guide.steps.map((step, index) => (
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
            )}

            {external && (
              <a
                href={external}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-3.5 text-title-md text-on-primary-container transition-transform active:scale-[0.98]"
              >
                <Icon name="external" size={18} />
                {externalOpenLabel(env)}
              </a>
            )}

            {showAddress && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-lowest p-2 pl-4">
                {/*
                  클립보드가 막힌 곳에서는 이 칸을 꾹 눌러 복사한다. 앱 전체가 글자 선택과 꾹 누르기 메뉴를
                  막아 두었는데 입력칸만 예외라서 글자가 아니라 읽기 전용 입력칸에 담는다
                */}
                <input
                  readOnly
                  value={url}
                  aria-label="Inkku 주소"
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 truncate bg-transparent text-body-md text-on-surface-variant outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void copyAddress();
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-bright px-3 py-2 text-label-lg text-on-surface"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={14} className={copied ? 'text-secondary' : ''} />
                  {copied ? '복사됨' : '주소 복사'}
                </button>
              </div>
            )}

            {guide.note && <p className="mt-3 text-label-md text-muted">{guide.note}</p>}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-label-lg text-muted"
        >
          {installed ? '닫기' : '나중에 하기'}
        </button>
      </div>
    </div>
  );
}
