import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from '@/components/ErrorBoundary';
import { installDebugErrorCapture } from '@/utils/debugLog';
import './index.css';

// 렌더 시작 전에 걸어야 초기 마운트 중 터진 에러도 폰 화면에서 볼 수 있다
installDebugErrorCapture();

const container = document.getElementById('root');
if (!container) {
  throw new Error('root 엘리먼트를 찾지 못했다. index.html이 바뀌었는지 확인할 것');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
