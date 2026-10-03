import { FONT_OPTIONS } from '@/fonts/catalog';
import {
  FONT_SIZE_STEP,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  TEXT_COLORS,
} from '@/layers/textStyle';
import type { TextDraft } from '@/layers/textDraft';
import type { TextAlign } from '@/layers/types';

const ALIGN_LABEL: Record<TextAlign, string> = {
  left: '왼쪽',
  center: '가운데',
  right: '오른쪽',
};

interface TextStyleControlsProps {
  draft: TextDraft;
  onChange: (patch: Partial<TextDraft>) => void;
  /**
   * 폰트와 색 두 줄만 보인다. 키보드가 떠 있는 동안 쓴다.
   * 다섯 줄을 다 두면 키보드 위에 자리가 모자라 줄이 반쯤 잘린 채 걸린다(아이폰은 더 많이 잘린다).
   * 치는 도중에 바꾸는 것은 폰트와 색이고, 정렬과 크기는 키보드를 내리면 다시 나온다.
   */
  compact?: boolean;
}

/** 모달 본문이 길어져서 스타일 조작만 따로 뺐다. 상태는 전부 부모가 들고 있다. */
export default function TextStyleControls({
  draft,
  onChange,
  compact = false,
}: TextStyleControlsProps) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-4'}`}>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto">
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange({ fontId: font.id })}
            // 폰트 이름은 그 폰트로 보여야 고르기 쉽다. 아직 안 받았으면 폴백으로 보인다.
            style={{ fontFamily: font.family }}
            className={`shrink-0 rounded-full px-4 py-2 text-body-lg transition-colors ${
              font.id === draft.fontId
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-surface-high text-on-surface'
            }`}
          >
            {font.label}
          </button>
        ))}
      </div>

      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto py-1">
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ color })}
            aria-label={`색상 ${color}`}
            style={{ backgroundColor: color }}
            className={`h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
              color === draft.color ? 'border-primary-container' : 'border-white/10'
            }`}
          />
        ))}
      </div>

      {!compact && <MoreControls draft={draft} onChange={onChange} />}
    </div>
  );
}

/** 정렬, 크기, 외곽선과 그림자. 키보드가 떠 있으면 접히는 줄들이다. */
function MoreControls({ draft, onChange }: TextStyleControlsProps) {
  return (
    <>
      <div className="flex gap-2">
        {(Object.keys(ALIGN_LABEL) as TextAlign[]).map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => onChange({ align })}
            className={`flex-1 rounded-2xl py-2.5 text-label-lg transition-transform active:scale-95 ${
              align === draft.align
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-high text-on-surface-variant'
            }`}
          >
            {ALIGN_LABEL[align]}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-label-md text-muted">
        <span className="w-8 shrink-0">크기</span>
        <input
          type="range"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={FONT_SIZE_STEP}
          value={draft.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.currentTarget.value) })}
          className="neo-slider flex-1"
        />
        <span className="w-8 shrink-0 text-right tabular-nums">{draft.fontSize}</span>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ stroke: !draft.stroke })}
          className={`flex-1 rounded-2xl py-2.5 text-label-lg transition-transform active:scale-95 ${
            draft.stroke
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-high text-on-surface-variant'
          }`}
        >
          외곽선
        </button>
        <button
          type="button"
          onClick={() => onChange({ shadow: !draft.shadow })}
          className={`flex-1 rounded-2xl py-2.5 text-label-lg transition-transform active:scale-95 ${
            draft.shadow
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-high text-on-surface-variant'
          }`}
        >
          그림자
        </button>
      </div>
    </>
  );
}
