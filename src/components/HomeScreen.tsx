interface HomeScreenProps {
  onCreate: () => void;
  onResume: () => void;
  /** 저장된 작업물의 레이어 수. null이면 이어서 편집할 것이 없다. */
  savedLayerCount: number | null;
}

export default function HomeScreen({ onCreate, onResume, savedLayerCount }: HomeScreenProps) {
  const canResume = savedLayerCount !== null;

  return (
    <div className="safe-top safe-bottom flex h-full flex-col justify-between px-6 py-10">
      <div className="pt-16">
        <h1 className="text-3xl font-semibold tracking-tight">Inkku</h1>
        <p className="mt-2 text-sm text-ink-muted">사진에 스티커와 낙서를 얹어 인스타에 올리기</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onCreate}
          className="w-full rounded-2xl bg-ink-accent py-4 text-base font-semibold text-white active:opacity-80"
        >
          새로 만들기
        </button>
        <button
          type="button"
          onClick={onResume}
          disabled={!canResume}
          className={`w-full rounded-2xl border border-ink-line py-4 text-base ${
            canResume ? 'text-ink-text active:opacity-70' : 'text-ink-muted opacity-40'
          }`}
        >
          {/* 몇 개가 들어 있는지 보여야 열기 전에 그 작업이 맞는지 알 수 있다 */}
          {canResume ? `이어서 편집 (${savedLayerCount}개)` : '이어서 편집'}
        </button>
      </div>
    </div>
  );
}
