import { useState } from 'react';
import StickerLevelRow from './StickerLevelRow';
import StickerPreview from './StickerPreview';
import {
  BORDER_LEVELS,
  DEFAULT_PLATE,
  OPACITY_LEVELS,
  OUTLINE_LEVELS,
  STICKER_COLORS,
  STICKER_PASTELS,
  type StickerPlate,
  type TextStickerStyle,
} from '@/layers/textSticker';
import {
  applyColor,
  colorOf,
  patchPlate,
  setBorderWidth,
  setOutlineWidth,
  type ColorTarget,
} from '@/layers/textStickerEdit';

const TARGETS: readonly { id: ColorTarget; label: string }[] = [
  { id: 'text', label: '글자' },
  { id: 'outline', label: '글자 테두리' },
  { id: 'plate', label: '배경' },
  { id: 'border', label: '테두리' },
];

interface StickerColorTabProps {
  style: TextStickerStyle;
  /** 도형이 없을 때 되살릴 도형. 배경색을 누르면 도형이 생긴다. */
  fallbackPlate: StickerPlate | null;
  onChange: (style: TextStickerStyle) => void;
}

/**
 * 색 탭. 칠할 자리(글자, 글자 테두리, 배경, 테두리)를 고르고 팔레트에서 색을 찍는다.
 *
 * 자리마다 팔레트를 따로 두면 화면이 네 배로 길어진다. 고른 자리에 맞는 두께나 진하기 줄만
 * 그때그때 함께 보여 준다. 꺼져 있는 자리(테두리 없음)에 색을 찍으면 그 자리가 켜진다.
 */
export default function StickerColorTab({ style, fallbackPlate, onChange }: StickerColorTabProps) {
  const [target, setTarget] = useState<ColorTarget>('text');
  const current = colorOf(style, target);
  const plate = style.plate ?? fallbackPlate ?? DEFAULT_PLATE;

  const swatchRow = (colors: readonly string[]) => (
    <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(applyColor(style, target, color, fallbackPlate))}
          aria-label={`색 ${color}`}
          style={{ backgroundColor: color }}
          className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
            color === current ? 'border-primary-container' : 'border-white/10'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="scroll-contain no-scrollbar flex gap-1.5 overflow-x-auto px-4">
        {TARGETS.map((item) => {
          const color = colorOf(style, item.id);
          const active = item.id === target;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTarget(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-label-lg transition-colors ${
                active ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-high text-muted'
              }`}
            >
              {/* 지금 그 자리의 색. 꺼져 있으면 빗금 친 빈 동그라미로 "없음"을 보여 준다 */}
              <span
                className="block h-5 w-5 rounded-full border border-black/20"
                style={{
                  background:
                    color ??
                    'linear-gradient(135deg, transparent 45%, #ff5376 45%, #ff5376 55%, transparent 55%), #ffffff',
                }}
              />
              {item.label}
            </button>
          );
        })}
      </div>

      {target === 'outline' && (
        <StickerLevelRow
          label="두께"
          levels={OUTLINE_LEVELS}
          value={style.outline?.width ?? null}
          onPick={(width) => onChange(setOutlineWidth(style, width))}
          renderPreview={(level) => (
            <StickerPreview
              text="가"
              style={setOutlineWidth({ ...style, plate: undefined }, level.value)}
              maxFontPx={22}
            />
          )}
        />
      )}
      {target === 'border' && (
        <StickerLevelRow
          label="두께"
          levels={BORDER_LEVELS}
          value={style.plate?.border?.width ?? null}
          onPick={(width) => onChange(setBorderWidth(style, width, fallbackPlate))}
          renderPreview={(level) => (
            <StickerPreview
              text="가"
              hideText
              style={setBorderWidth({ ...style, plate }, level.value, null)}
              maxFontPx={30}
            />
          )}
        />
      )}
      {target === 'plate' && (
        <StickerLevelRow
          label="진하기"
          levels={OPACITY_LEVELS}
          value={style.plate?.opacity ?? null}
          tileClassName="asset-checker"
          onPick={(opacity) => onChange(patchPlate(style, { opacity }, fallbackPlate))}
          renderPreview={(level) => (
            <StickerPreview
              text="가"
              hideText
              style={patchPlate({ ...style, plate }, { opacity: level.value }, null)}
              maxFontPx={30}
            />
          )}
        />
      )}

      {swatchRow(STICKER_COLORS)}
      {swatchRow(STICKER_PASTELS)}
    </div>
  );
}
