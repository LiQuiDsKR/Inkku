interface EditorTopBarProps {
  onBack: () => void;
}

export default function EditorTopBar({ onBack }: EditorTopBarProps) {
  return (
    <header className="safe-top flex shrink-0 items-center justify-between border-b border-ink-line px-2">
      <button type="button" onClick={onBack} className="px-3 py-3 text-sm">
        뒤로
      </button>

      {/* 실행취소와 다시실행은 히스토리가 들어오는 Phase 2에서 연결한다.
          지금 자리를 잡아 둬야 상단 바 높이를 실기기에서 미리 확인할 수 있다. */}
      <div className="flex items-center gap-1">
        <button type="button" disabled className="px-3 py-3 text-sm text-ink-muted opacity-40">
          실행취소
        </button>
        <button type="button" disabled className="px-3 py-3 text-sm text-ink-muted opacity-40">
          다시실행
        </button>
      </div>

      {/* 완료(내보내기)는 Phase 4 */}
      <button type="button" disabled className="px-3 py-3 text-sm text-ink-muted opacity-40">
        완료
      </button>
    </header>
  );
}
