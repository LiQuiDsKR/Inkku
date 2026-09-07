import { getRatioSize, RATIO_LIST } from '@/layers/ratio';
import type { Ratio } from '@/layers/types';

const RATIO_LABEL: Record<Ratio, string> = {
  '4:5': '인스타 피드',
  '1:1': '정사각형',
  '9:16': '스토리',
  '3:4': '세로',
};

/** 미리보기 칩의 최대 변 길이(px). 비율 차이가 한눈에 보일 정도면 충분하다. */
const PREVIEW_EDGE = 56;

interface RatioScreenProps {
  onSelect: (ratio: Ratio) => void;
  onBack: () => void;
}

export default function RatioScreen({ onSelect, onBack }: RatioScreenProps) {
  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-6 py-6">
      <button type="button" onClick={onBack} className="self-start py-2 text-sm text-ink-muted">
        뒤로
      </button>

      <h2 className="mt-4 text-xl font-semibold">비율 선택</h2>
      <p className="mt-1 text-sm text-ink-muted">나중에 바꾸면 배치가 틀어질 수 있다</p>

      <div className="mt-6 flex flex-col gap-3">
        {RATIO_LIST.map((ratio) => {
          const size = getRatioSize(ratio);
          const scale = PREVIEW_EDGE / Math.max(size.width, size.height);
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onSelect(ratio)}
              className="flex items-center gap-4 rounded-2xl border border-ink-line bg-ink-panel p-4 text-left active:opacity-80"
            >
              <span
                className="shrink-0 rounded-sm bg-ink-text"
                style={{ width: size.width * scale, height: size.height * scale }}
              />
              <span className="flex flex-col">
                <span className="text-base font-medium">{ratio}</span>
                <span className="text-xs text-ink-muted">{RATIO_LABEL[ratio]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
