interface ToolButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** 하단 툴바의 한 칸. 이모지를 쓰지 않으므로 글자 라벨만으로 구분한다. */
export default function ToolButton({ label, onClick, disabled = false }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center py-3 text-xs ${
        disabled ? 'text-ink-muted opacity-40' : 'text-ink-text active:opacity-60'
      }`}
    >
      {label}
    </button>
  );
}
