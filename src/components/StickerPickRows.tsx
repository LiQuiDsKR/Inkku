import StickerPreview from './StickerPreview';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';
import { FONT_OPTIONS } from '@/fonts/catalog';
import { sameStyle, type TextStickerStyle } from '@/layers/textSticker';
import { TEXT_STICKER_PRESETS } from '@/layers/textStickerPresets';

interface PickRowProps {
  text: string;
  style: TextStickerStyle;
  onChange: (style: TextStickerStyle) => void;
}

/** 글꼴 견본에 쓸 짧은 문구. 문구 전체를 넣으면 칸이 작아서 글꼴 생김새가 안 보인다. */
function fontSample(text: string): string {
  const first = text.split('\n').find((line) => line.trim().length > 0) ?? '';
  const chars = Array.from(first.trim());
  return chars.length > 0 ? chars.slice(0, 6).join('') : '가나다';
}

function Tile({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[84px] shrink-0 flex-col items-center gap-1 transition-transform active:scale-95"
    >
      <span
        className={`block h-[84px] w-[84px] overflow-hidden rounded-2xl border-2 ${
          active ? 'border-primary-container' : 'border-transparent'
        }`}
        style={{ background: VECTOR_TILE_BACKGROUND }}
      >
        {children}
      </span>
      <span
        className={`max-w-full truncate text-label-md ${active ? 'text-on-surface' : 'text-muted'}`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * 스타일 탭. 지금 친 문구를 프리셋마다 그려서 보여 준다.
 * 고르면 글꼴까지 통째로 바뀌고 문구는 그대로 남는다.
 */
export function StickerPresetRow({ text, style, onChange }: PickRowProps) {
  return (
    <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4">
      {TEXT_STICKER_PRESETS.map((preset) => (
        <Tile
          key={preset.id}
          label={preset.label}
          active={sameStyle(style, preset.style)}
          onClick={() => onChange(preset.style)}
        >
          <StickerPreview text={text || preset.sample} style={preset.style} maxFontPx={22} />
        </Tile>
      ))}
    </div>
  );
}

/**
 * 글꼴 탭. 글꼴 이름이 아니라 내 문구가 그 글꼴로 어떻게 보이는지를 보여 준다.
 * 이 탭을 열면 견본을 그리려고 글꼴을 전부 받는다. 고르는 사람이 직접 연 화면이라 받을 만하다.
 */
export function StickerFontRow({ text, style, onChange }: PickRowProps) {
  const sample = fontSample(text);
  return (
    <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4">
      {FONT_OPTIONS.map((font) => (
        <Tile
          key={font.id}
          label={font.label}
          active={font.id === style.fontId}
          onClick={() => onChange({ ...style, fontId: font.id })}
        >
          <StickerPreview text={sample} style={{ ...style, fontId: font.id }} maxFontPx={24} />
        </Tile>
      ))}
    </div>
  );
}
