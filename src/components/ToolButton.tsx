interface ToolButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** 패널이 열려 있는 도구. 어떤 화면인지 헷갈리지 않게 표시한다. */
  active?: boolean;
}

/** 하단 툴바의 한 칸. 이모지를 쓰지 않으므로 글자 라벨만으로 구분한다. */
export default function ToolButton({
  label,
  onClick,
  disabled = false,
  active = false,
}: ToolButtonProps) {
  const tone = disabled
    ? 'text-ink-muted opacity-40'
    : active
      ? 'text-ink-accent'
      : 'text-ink-text active:opacity-60';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center py-3 text-xs ${tone}`}
    >
      {label}
    </button>
  );
}
