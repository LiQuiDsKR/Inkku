interface HomeScreenProps {
  onCreate: () => void;
}

export default function HomeScreen({ onCreate }: HomeScreenProps) {
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
        {/* 이어서 편집은 자동 저장이 붙는 Phase 4에서 살린다 */}
        <button
          type="button"
          disabled
          className="w-full rounded-2xl border border-ink-line py-4 text-base text-ink-muted opacity-40"
        >
          이어서 편집
        </button>
      </div>
    </div>
  );
}
