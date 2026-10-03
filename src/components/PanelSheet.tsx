import type { ReactNode } from 'react';
import Icon from './icons/Icon';

interface PanelSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /**
   * 내용이 적어도 최대 높이를 그대로 차지한다. 탭이 있는 패널에 쓴다.
   * 패널은 캔버스와 같은 흐름에 있어서, 탭마다 높이가 다르면 캔버스가 그만큼 커졌다 작아지며 그림이 튄다.
   * 별, 음식처럼 두 줄이 안 되는 탭에서도 아래를 비워 두고 높이를 지킨다.
   */
  fixedHeight?: boolean;
}

/**
 * 하단에서 올라오는 패널의 공통 껍데기.
 *
 * 캔버스를 완전히 덮지 않는 높이로 고정한다. 스티커를 고르는 동안에도
 * 사진이 보여야 어떤 스티커가 어울리는지 판단할 수 있다.
 */
export default function PanelSheet({
  title,
  onClose,
  children,
  fixedHeight = false,
}: PanelSheetProps) {
  return (
    <section
      className={`relative z-40 flex ${
        fixedHeight ? 'h-[46vh]' : 'max-h-[46vh]'
      } shrink-0 flex-col rounded-t-3xl bg-surface-container shadow-[0_-8px_24px_rgba(0,0,0,0.45)]`}
    >
      {/* 잡아서 내릴 수 있게 생겼다는 신호. 실제 드래그는 아직 없고 닫기 버튼이 그 일을 한다 */}
      <div className="flex justify-center pt-2">
        <span className="h-1 w-9 rounded-full bg-white/20" />
      </div>

      <header className="flex shrink-0 items-center justify-between px-4 py-2">
        <h2 className="text-title-md text-on-surface">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-transform active:scale-90"
        >
          <Icon name="close" size={16} />
        </button>
      </header>

      {/* scroll-contain이 없으면 그리드를 끝까지 넘겼을 때 페이지 전체가 당겨진다 */}
      <div className="scroll-contain min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}
