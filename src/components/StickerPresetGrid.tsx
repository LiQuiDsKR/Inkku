import StickerPreview from './StickerPreview';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';
import { TEXT_STICKER_PRESETS } from '@/layers/textStickerPresets';

interface StickerPresetGridProps {
  onPick: (presetId: string) => void;
}

/**
 * 요소 패널의 문구 스티커 목록.
 *
 * 프리셋마다 제일 잘 어울리는 견본 문구로 그린다. 이름만 보고는 "레이스"가 어떤 모양인지 모른다.
 * 누르면 그 프리셋으로 편집 화면이 열리고, 거기서 문구와 색과 도형을 바꾼다.
 */
export default function StickerPresetGrid({ onPick }: StickerPresetGridProps) {
  return (
    <div className="px-4 pb-4">
      <p className="pb-2 text-label-md text-muted">고르면 문구를 바꿔 쓸 수 있다</p>
      {/* 태블릿처럼 넓은 화면에서 세 칸이면 한 칸이 손바닥만 해져 몇 개 보이지 않는다 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TEXT_STICKER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPick(preset.id)}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
          >
            {/* 흰 바탕 스티커와 검은 글자 스티커가 둘 다 보이도록 중간 회색 칸에 둔다 */}
            <span
              className="block aspect-square w-full overflow-hidden rounded-xl"
              style={{ background: VECTOR_TILE_BACKGROUND }}
            >
              <StickerPreview text={preset.sample} style={preset.style} maxFontPx={22} />
            </span>
            <span className="text-label-md text-muted">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
