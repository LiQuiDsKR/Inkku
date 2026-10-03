import StickerLevelRow from './StickerLevelRow';
import StickerPreview from './StickerPreview';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';
import { PLATE_SHAPES } from '@/layers/plateShapes';
import {
  DEFAULT_PLATE,
  PAD_LEVELS,
  SOFT_LEVELS,
  type StickerPlate,
  type TextStickerStyle,
} from '@/layers/textSticker';
import { patchPlate, setPlateShape } from '@/layers/textStickerEdit';

/** 도형 견본의 크기를 잡을 때 쓰는 문구. 글자는 그리지 않고 세 글자짜리 상자 둘레의 모양만 보여 준다. */
const SHAPE_SAMPLE = '가나다';

interface StickerShapeTabProps {
  style: TextStickerStyle;
  fallbackPlate: StickerPlate | null;
  onChange: (style: TextStickerStyle) => void;
}

/**
 * 도형 탭. 글자 뒤에 깔 모양과 부드러운 가장자리, 여백.
 *
 * 모양은 이름 없이 실루엣으로 보여 준다(요소 패널의 도형 목록과 같은 이유다).
 * 견본은 지금 배경색과 테두리로 그려서, 고르면 어떻게 될지가 그대로 보인다.
 */
export default function StickerShapeTab({ style, fallbackPlate, onChange }: StickerShapeTabProps) {
  const plate = style.plate ?? fallbackPlate ?? DEFAULT_PLATE;
  const withPlate: TextStickerStyle = { ...style, plate };

  return (
    <div className="flex flex-col gap-2">
      <div className="scroll-contain no-scrollbar flex gap-1.5 overflow-x-auto px-4">
        <button
          type="button"
          onClick={() => onChange(setPlateShape(style, null, fallbackPlate))}
          aria-label="도형 없음"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-label-md text-muted transition-transform active:scale-90 ${
            style.plate ? 'border-transparent bg-surface-high' : 'border-primary-container bg-surface-high'
          }`}
        >
          없음
        </button>
        {PLATE_SHAPES.map((entry) => (
          <button
            key={entry.shape}
            type="button"
            onClick={() => onChange(setPlateShape(style, entry.shape, fallbackPlate))}
            aria-label={entry.label}
            title={entry.label}
            className={`block h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-transform active:scale-90 ${
              style.plate?.shape === entry.shape ? 'border-primary-container' : 'border-transparent'
            }`}
            style={{ background: VECTOR_TILE_BACKGROUND }}
          >
            <StickerPreview
              text={SHAPE_SAMPLE}
              hideText
              style={{ ...withPlate, plate: { ...plate, shape: entry.shape, soft: 0 } }}
            />
          </button>
        ))}
      </div>

      <StickerLevelRow
        label="가장자리"
        levels={SOFT_LEVELS}
        value={style.plate ? style.plate.soft : null}
        onPick={(soft) => onChange(patchPlate(style, { soft }, fallbackPlate))}
        renderPreview={(level) => (
          <StickerPreview
            text="가"
            hideText
            style={patchPlate(withPlate, { soft: level.value }, null)}
            maxFontPx={18}
          />
        )}
      />

      <StickerLevelRow
        label="여백"
        levels={PAD_LEVELS}
        value={style.plate ? style.plate.pad : null}
        onPick={(pad) => onChange(patchPlate(style, { pad }, fallbackPlate))}
        renderPreview={(level) => (
          <StickerPreview
            text="가"
            style={patchPlate(withPlate, { pad: level.value }, null)}
            maxFontPx={30}
          />
        )}
      />
    </div>
  );
}
