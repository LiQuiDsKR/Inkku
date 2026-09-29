import { HEART_PATH } from '@/layers/shapeStyle';
import type { PhotoMask } from '@/layers/types';

/**
 * 자르기 모양 견본.
 *
 * 캔버스는 클리핑 경로로, 여기는 SVG로 같은 모양을 그린다(템플릿 썸네일과 같은 방식이다).
 * 이름만 늘어놓으면 "마름모"와 "삼각형"이 어떤 각도인지 눌러 봐야 알 수 있다.
 */

const BOX = 256;

/** 별 꼭짓점. 캔버스 쪽 STAR_INNER와 같은 비율이라 견본과 결과가 같은 별로 보인다. */
const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const radius = index % 2 === 0 ? BOX / 2 : (BOX / 2) * 0.44;
  const angle = (Math.PI / 5) * index - Math.PI / 2;
  return `${BOX / 2 + Math.cos(angle) * radius},${BOX / 2 + Math.sin(angle) * radius}`;
}).join(' ');

interface MaskSwatchProps {
  mask: PhotoMask;
  className?: string;
}

export default function MaskSwatch({ mask, className }: MaskSwatchProps) {
  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} className={className} aria-hidden="true" focusable="false">
      {mask === 'rounded' && (
        <rect x="6" y="6" width={BOX - 12} height={BOX - 12} rx={BOX * 0.12} fill="currentColor" />
      )}
      {mask === 'circle' && <circle cx={BOX / 2} cy={BOX / 2} r={BOX / 2 - 6} fill="currentColor" />}
      {mask === 'star' && <polygon points={STAR_POINTS} fill="currentColor" />}
      {mask === 'heart' && <path d={HEART_PATH} fill="currentColor" />}
      {mask === 'triangle' && (
        <polygon points={`${BOX / 2},10 ${BOX - 10},${BOX - 16} 10,${BOX - 16}`} fill="currentColor" />
      )}
      {mask === 'diamond' && (
        <polygon
          points={`${BOX / 2},6 ${BOX - 6},${BOX / 2} ${BOX / 2},${BOX - 6} 6,${BOX / 2}`}
          fill="currentColor"
        />
      )}
    </svg>
  );
}
