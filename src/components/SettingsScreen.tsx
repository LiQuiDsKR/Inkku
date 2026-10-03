import Icon from './icons/Icon';
import { useSettingsStore } from '@/store/settingsStore';

interface SettingsScreenProps {
  onBack: () => void;
}

/**
 * 앱 설정.
 *
 * 작업물이 아니라 쓰는 사람의 취향이라 홈에서 연다. 값은 `settingsStore`가 기기에 남긴다.
 * 편집 중에 자주 바꾸는 것(고른 것을 맨 위로)은 레이어 목록에도 같은 스위치가 있다.
 */
export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const autoFront = useSettingsStore((state) => state.autoFront);
  const setAutoFront = useSettingsStore((state) => state.setAutoFront);

  return (
    <div className="safe-top safe-bottom scroll-contain h-full overflow-y-auto px-5 pb-8">
      <header className="flex items-center gap-2 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-on-surface transition-transform active:scale-90"
        >
          <Icon name="back" size={18} />
        </button>
        <h1 className="text-title-md text-on-surface">설정</h1>
      </header>

      <h2 className="mt-2 px-1 text-label-md text-muted">편집</h2>
      <section className="mt-2 overflow-hidden rounded-3xl bg-surface-container">
        <label className="flex items-center gap-3 p-4">
          <span className="min-w-0 flex-1">
            <span className="block text-title-md text-on-surface">누른 요소를 맨 위로</span>
            <span className="mt-0.5 block text-body-md text-on-surface-variant">
              캔버스에서 요소를 누르면 다른 것에 가리지 않게 맨 위로 올린다. 끄면 놓아 둔 순서를
              그대로 지킨다.
            </span>
          </span>
          <input
            type="checkbox"
            checked={autoFront}
            onChange={(event) => setAutoFront(event.currentTarget.checked)}
            className="neo-check"
          />
        </label>
      </section>
    </div>
  );
}
