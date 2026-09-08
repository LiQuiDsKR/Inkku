import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logDebug } from '@/utils/debugLog';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

/**
 * 렌더 중에 터진 예외를 잡는다.
 *
 * 리액트는 렌더에서 예외가 나면 트리를 통째로 비운다. 폰에서는 그 결과가 흰 화면 하나뿐이라
 * 무슨 일이 났는지도, 작업물이 남았는지도 알 수 없다.
 * 자동 저장이 있으므로 새로고침하면 대개 직전 상태로 돌아온다. 그 길을 안내한다.
 *
 * 훅으로는 만들 수 없다. componentDidCatch는 클래스 컴포넌트에만 있다.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 개발 중에는 디버그 오버레이로 흘려 보낸다. 폰에는 콘솔이 없다.
    logDebug(`화면 오류: ${error.message}`);
    logDebug(String(info.componentStack).split('\n').slice(0, 3).join(' '));
  }

  render(): ReactNode {
    const { message } = this.state;
    if (message === null) return this.props.children;

    return (
      <div className="safe-top safe-bottom flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-headline-md text-on-surface">화면을 그리지 못했다</p>
        <p className="text-body-md break-words text-muted">{message}</p>
        <p className="text-body-md text-on-surface-variant">
          작업물은 자동으로 저장된다. 다시 열면 마지막 상태에서 이어서 편집할 수 있다.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary-container px-6 py-3 text-title-md text-on-primary-container"
        >
          다시 열기
        </button>
      </div>
    );
  }
}
