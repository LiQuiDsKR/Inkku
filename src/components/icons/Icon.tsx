import { ICON_PATHS, type IconName } from './paths';

interface IconProps {
  name: IconName;
  /** 화면 픽셀 크기. 손으로 누르는 버튼은 20 이상이어야 알아본다. */
  size?: number;
  className?: string;
}

/**
 * 인라인 SVG 아이콘.
 * 색은 currentColor를 따르므로 글자 색만 바꾸면 아이콘도 같이 바뀐다.
 */
export default function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // 장식이다. 버튼 이름은 라벨이나 aria-label이 따로 갖는다.
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
