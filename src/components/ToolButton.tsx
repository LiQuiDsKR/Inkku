import Icon from './icons/Icon';
import type { IconName } from './icons/paths';

interface ToolButtonProps {
  label: string;
  icon: IconName;
  onClick?: () => void;
  disabled?: boolean;
  /** 패널이 열려 있는 도구. 어떤 화면인지 헷갈리지 않게 표시한다. */
  active?: boolean;
}

/**
 * 하단 툴바의 한 칸.
 *
 * 아이콘 위에 글자를 둔다. 아이콘만 두면 처음 쓰는 사람이 "도형"과 "배경"을 구분하지 못하고,
 * 글자만 두면 여섯 칸이 비슷해 보여 눈이 목표를 못 찾는다.
 */
export default function ToolButton({
  label,
  icon,
  onClick,
  disabled = false,
  active = false,
}: ToolButtonProps) {
  const badge = active
    ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(255,83,118,0.5)]'
    : 'bg-surface-high text-on-surface-variant';

  const text = active ? 'text-primary font-bold' : 'text-on-surface-variant';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-transform active:scale-95 ${
        disabled ? 'opacity-35' : ''
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${badge}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className={`text-label-sm ${text}`}>{label}</span>
    </button>
  );
}
