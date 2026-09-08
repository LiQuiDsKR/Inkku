import Icon from './icons/Icon';
import ProjectThumbnail from './ProjectThumbnail';
import type { Project } from '@/layers/types';

interface HomeScreenProps {
  onCreate: () => void;
  onResume: () => void;
  /** 저장된 작업물. 없으면 이어서 편집할 것이 없다. */
  saved: Project | null;
}

function formatUpdatedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const sameDay = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `오늘 ${time}` : `${date.toLocaleDateString('ko-KR')} ${time}`;
}

export default function HomeScreen({ onCreate, onResume, saved }: HomeScreenProps) {
  return (
    <div className="safe-top safe-bottom scroll-contain h-full overflow-y-auto px-5 pb-8">
      <header className="flex items-center gap-2 py-5">
        <Icon name="sparkle" size={22} className="text-primary" />
        <div className="flex flex-col">
          <h1 className="text-headline-lg text-on-surface">Inkku</h1>
          <p className="text-label-md text-muted">Studio NeoDeco</p>
        </div>
      </header>

      {/* 첫 화면에서 할 일은 하나뿐이다. 그 하나를 크게 둔다 */}
      <section className="rounded-3xl bg-surface-container p-5">
        <span className="flex items-center gap-1.5 text-label-md text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          NEODECO STUDIO
        </span>
        <h2 className="mt-3 text-display-lg text-on-surface">Inkku</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          5분 만에 끝내는 감성 인스타 꾸미기
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-4 text-title-md text-on-primary-container shadow-[0_8px_24px_-8px_rgba(255,83,118,0.8)] transition-transform active:scale-[0.98]"
        >
          <Icon name="sparkle" size={18} />
          새 사진 꾸미기
          <Icon name="next" size={16} />
        </button>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h3 className="text-headline-md text-on-surface">이어서 편집하기</h3>
          {saved && (
            <span className="flex items-center gap-1 text-label-sm text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              자동 저장됨
            </span>
          )}
        </div>

        {saved ? (
          <div className="mt-3 overflow-hidden rounded-3xl bg-surface-container">
            <div className="relative h-56 overflow-hidden bg-surface-lowest">
              <ProjectThumbnail project={saved} className="h-full w-full object-cover" />
              {/* 배지가 사진 위에 놓이므로 아래쪽을 어둡게 깔아 글자를 살린다 */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Badge>{saved.ratio}</Badge>
                <Badge accent>
                  <Icon name="layers" size={12} />
                  {`${saved.layers.length}개 레이어`}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-title-md text-on-surface">마지막 작업</p>
                <p className="truncate text-body-md text-on-surface-variant">
                  {`수정: ${formatUpdatedAt(saved.updatedAt)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onResume}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-bright px-4 py-2.5 text-label-lg text-on-surface transition-transform active:scale-95"
              >
                <Icon name="draw" size={16} className="text-primary" />
                이어서 하기
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-3xl bg-surface-container p-5 text-body-md text-muted">
            아직 저장된 작업물이 없다. 새로 만들면 편집하는 동안 자동으로 저장된다.
          </p>
        )}
      </section>
    </div>
  );
}

function Badge({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full bg-surface-lowest/80 px-2.5 py-1 text-label-sm backdrop-blur-md ${
        accent ? 'text-primary' : 'text-on-surface'
      }`}
    >
      {children}
    </span>
  );
}
