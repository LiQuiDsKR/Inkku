import type { ReactNode } from 'react';
import { nearestLevel, type StyleLevel } from '@/layers/textSticker';

interface StickerLevelRowProps {
  label: string;
  levels: readonly StyleLevel[];
  /** 지금 값. null이면 그 부분이 꺼져 있어 첫 단계(없음)가 켜진 것으로 본다. */
  value: number | null;
  /** 단계 하나의 견본. 글자로 "굵게"라고 적는 것보다 굵은 테두리를 보여 주는 편이 빠르다. */
  renderPreview: (level: StyleLevel) => ReactNode;
  onPick: (value: number) => void;
  /** 견본 칸 바탕. 진하기처럼 비침을 봐야 하는 단계는 체크무늬를 깐다. */
  tileClassName?: string;
}

/** 두께, 흐림, 여백, 진하기처럼 단계로 고르는 줄. 칸마다 그 단계를 적용한 견본을 그린다. */
export default function StickerLevelRow({
  label,
  levels,
  value,
  renderPreview,
  onPick,
  tileClassName = 'bg-surface-high',
}: StickerLevelRowProps) {
  // 꺼져 있으면 "없음" 단계만 켠다. 없음이 없는 줄(진하기)은 아무것도 켜지 않는다
  const active =
    value === null ? levels.find((level) => level.value === 0) : nearestLevel(levels, value);

  return (
    <div className="flex items-center gap-2 px-4">
      <span className="w-14 shrink-0 text-label-md text-muted">{label}</span>
      <div className="scroll-contain no-scrollbar flex gap-1.5 overflow-x-auto">
        {levels.map((level) => (
          <button
            key={level.label}
            type="button"
            onClick={() => onPick(level.value)}
            aria-label={`${label} ${level.label}`}
            className="flex w-11 shrink-0 flex-col items-center gap-0.5 transition-transform active:scale-90"
          >
            <span
              className={`block h-10 w-10 overflow-hidden rounded-xl border-2 ${tileClassName} ${
                level === active ? 'border-primary-container' : 'border-transparent'
              }`}
            >
              {renderPreview(level)}
            </span>
            <span
              className={`whitespace-nowrap text-label-sm ${
                level === active ? 'text-on-surface' : 'text-muted'
              }`}
            >
              {level.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
