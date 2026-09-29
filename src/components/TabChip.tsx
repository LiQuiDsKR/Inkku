interface TabChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** 탭 아래 단계(그림체, 묶음)는 한 치수 작게 그려 위 단계와 구분한다. */
  small?: boolean;
}

/** 요소 패널의 칩. 고른 칩은 버터 옐로(활성 칩 색)로 칠한다. */
export default function TabChip({ label, active, onClick, small = false }: TabChipProps) {
  const size = small ? 'px-2.5 py-1 text-label-md' : 'px-3 py-1.5 text-label-lg';
  const tone = active
    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
    : small
      ? 'bg-surface-highest/60 text-muted'
      : 'bg-surface-high text-muted';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full transition-colors ${size} ${tone}`}
    >
      {label}
    </button>
  );
}
