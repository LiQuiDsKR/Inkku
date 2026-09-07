import type { ReactNode } from 'react';

interface PanelSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 하단에서 올라오는 패널의 공통 껍데기.
 *
 * 캔버스를 완전히 덮지 않는 높이로 고정한다. 스티커를 고르는 동안에도
 * 사진이 보여야 어떤 스티커가 어울리는지 판단할 수 있다.
 */
export default function PanelSheet({ title, onClose, children }: PanelSheetProps) {
  return (
    <section className="relative z-40 flex max-h-[46vh] shrink-0 flex-col border-t border-ink-line bg-ink-panel">
      <header className="flex shrink-0 items-center justify-between px-4 py-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <button type="button" onClick={onClose} className="px-2 py-1 text-xs text-ink-muted">
          닫기
        </button>
      </header>
      {/* scroll-contain이 없으면 그리드를 끝까지 넘겼을 때 페이지 전체가 당겨진다 */}
      <div className="scroll-contain min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}
