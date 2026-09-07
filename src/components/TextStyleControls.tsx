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
}

/** 모달 본문이 길어져서 스타일 조작만 따로 뺐다. 상태는 전부 부모가 들고 있다. */
export default function TextStyleControls({ draft, onChange }: TextStyleControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="scroll-contain flex gap-2 overflow-x-auto">
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange({ fontId: font.id })}
            // 폰트 이름은 그 폰트로 보여야 고르기 쉽다. 아직 안 받았으면 폴백으로 보인다.
            style={{ fontFamily: font.family }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              font.id === draft.fontId ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-text'
            }`}
          >
            {font.label}
          </button>
        ))}
      </div>

      <div className="scroll-contain flex gap-2 overflow-x-auto py-1">
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ color })}
            aria-label={`색상 ${color}`}
            style={{ backgroundColor: color }}
            className={`h-9 w-9 shrink-0 rounded-full border-2 ${
              color === draft.color ? 'border-ink-accent' : 'border-ink-line'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        {(Object.keys(ALIGN_LABEL) as TextAlign[]).map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => onChange({ align })}
            className={`flex-1 rounded-xl py-2 text-xs ${
              align === draft.align ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-muted'
            }`}
          >
            {ALIGN_LABEL[align]}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="w-8 shrink-0">크기</span>
        <input
          type="range"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={FONT_SIZE_STEP}
          value={draft.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.currentTarget.value) })}
          className="h-9 flex-1 accent-[var(--color-ink-accent)]"
        />
        <span className="w-8 shrink-0 text-right tabular-nums">{draft.fontSize}</span>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ stroke: !draft.stroke })}
          className={`flex-1 rounded-xl py-2 text-xs ${
            draft.stroke ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-muted'
          }`}
        >
          외곽선
        </button>
        <button
          type="button"
          onClick={() => onChange({ shadow: !draft.shadow })}
          className={`flex-1 rounded-xl py-2 text-xs ${
            draft.shadow ? 'bg-ink-accent text-white' : 'bg-ink-bg text-ink-muted'
          }`}
        >
          그림자
        </button>
      </div>
    </div>
  );
}
