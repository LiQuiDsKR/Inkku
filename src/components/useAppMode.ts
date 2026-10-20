import { useEffect, useState } from 'react';
import { canFullscreen, isFullscreen, isStandalone } from '@/utils/appMode';

/**
 * 크롬이 "설치할 수 있다"고 알려 주는 이벤트. 표준 타입 정의에 아직 없어서 필요한 만큼만 적는다.
 * 이 이벤트를 붙잡아 두었다가 버튼을 눌렀을 때 prompt()를 불러야 설치 창이 뜬다.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && typeof (event as { prompt?: unknown }).prompt === 'function';
}

/**
 * 이벤트는 앱이 뜨자마자 한 번 온다. 홈 화면이 그보다 늦게 그려지면 놓치므로
 * 모듈이 읽히는 순간부터 받아 둔다.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
/** 이 탭에서 설치를 마쳤는지. 탭은 여전히 브라우저라 standalone으로는 알 수 없다. */
let installedHere = false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    if (!isInstallPrompt(event)) return;
    // 크롬이 스스로 띄우는 작은 배너 대신 우리 버튼에서 띄운다
    event.preventDefault();
    deferredPrompt = event;
    listeners.forEach((notify) => notify());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedHere = true;
    listeners.forEach((notify) => notify());
  });
}

export interface AppMode {
  /** 이 브라우저가 전체 화면을 허락하는지. 아이폰은 false다. */
  fullscreenSupported: boolean;
  fullscreen: boolean;
  /** 홈 화면 아이콘으로 열렸는지. */
  standalone: boolean;
  /** 이 탭에서 방금 설치를 마쳤는지. 이제 할 일은 홈 화면 아이콘으로 다시 여는 것뿐이다. */
  installed: boolean;
  /** 크롬의 설치 창을 띄울 수 있으면 그 함수. 사용자가 설치를 골랐으면 true로 끝난다. */
  install: (() => Promise<boolean>) | null;
}

export function useAppMode(): AppMode {
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  const [standalone, setStandalone] = useState(isStandalone);
  const [installable, setInstallable] = useState(deferredPrompt !== null);
  const [installed, setInstalled] = useState(installedHere);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);

    const syncInstall = () => {
      setInstallable(deferredPrompt !== null);
      setInstalled(installedHere);
      setStandalone(isStandalone());
    };
    listeners.add(syncInstall);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
      listeners.delete(syncInstall);
    };
  }, []);

  const install = installable
    ? async () => {
        const prompt = deferredPrompt;
        if (!prompt) return false;
        // 설치 창은 한 이벤트로 한 번만 띄울 수 있다. 쓰고 나면 버린다
        deferredPrompt = null;
        setInstallable(false);
        await prompt.prompt();
        const choice = await prompt.userChoice;
        return choice.outcome === 'accepted';
      }
    : null;

  return { fullscreenSupported: canFullscreen(), fullscreen, standalone, installed, install };
}
