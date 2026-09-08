import Icon from './icons/Icon';
import { EXPORT_LONG_EDGE } from '@/export/renderProject';
import { getPixelSize, getRatioSize, RATIO_LIST } from '@/layers/ratio';
import type { Ratio } from '@/layers/types';

interface RatioInfo {
  label: string;
  detail: string;
  badge: string;
}

const RATIO_INFO: Record<Ratio, RatioInfo> = {
  '4:5': { label: '피드 세로형', detail: '주목도 높은 황금비율', badge: 'BEST' },
  '1:1': { label: '정사각형', detail: '클래식한 피드 그리드', badge: '피드 기본' },
  '9:16': { label: '스토리, 릴스', detail: '화면 꽉 찬 세로 숏폼', badge: 'FULL' },
  '3:4': { label: '일반 사진', detail: '스마트폰 기본 비율', badge: '카메라 기본' },
};

/** 카드 안 미리보기 칩의 최대 변 길이(px). 비율 차이가 한눈에 보일 정도면 충분하다. */
const PREVIEW_EDGE = 72;

interface RatioScreenProps {
  onSelect: (ratio: Ratio) => void;
  onBack: () => void;
}

/**
 * 비율 선택.
 *
 * 나중에 바꾸면 배치가 틀어지므로 처음에 한 번 고르게 한다.
 * 결과물이 어디에 올라가는지(피드, 스토리)를 같이 적어야 숫자만 보고 헤매지 않는다.
 */
export default function RatioScreen({ onSelect, onBack }: RatioScreenProps) {
  return (
    <div className="safe-top safe-bottom scroll-contain h-full overflow-y-auto px-5 pb-8">
      <header className="flex items-center gap-2 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-on-surface transition-transform active:scale-90"
        >
          <Icon name="back" size={18} />
        </button>
        <h1 className="text-title-md text-on-surface">캔버스 설정</h1>
      </header>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary-container px-2.5 py-1 text-label-sm text-on-primary-container">
          CANVAS SETUP
        </span>
        <span className="flex items-center gap-1 text-label-md text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          Instagram Ready
        </span>
      </div>

      <h2 className="mt-3 text-headline-lg text-on-surface">어떤 비율로 꾸며볼까?</h2>
      <p className="mt-1 text-body-md text-on-surface-variant">
        올릴 곳에 맞춰 고른다. 나중에 바꾸면 배치가 틀어질 수 있다.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {RATIO_LIST.map((ratio) => {
          const size = getRatioSize(ratio);
          const output = getPixelSize(ratio, EXPORT_LONG_EDGE);
          const info = RATIO_INFO[ratio];
          const scale = PREVIEW_EDGE / Math.max(size.width, size.height);

          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onSelect(ratio)}
              className="flex flex-col rounded-3xl bg-surface-container p-4 text-left transition-transform active:scale-[0.97]"
            >
              <span className="self-start rounded-full bg-surface-high px-2 py-0.5 text-label-sm text-on-surface-variant">
                {info.badge}
              </span>

              <span className="my-4 flex justify-center">
                {/* 어두운 카드 위 어두운 칩이라 그대로 두면 형태가 안 보인다. 위쪽에 옅은 색을 깐다 */}
                <span
                  className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-surface-lowest text-label-md text-primary"
                  style={{ width: size.width * scale, height: size.height * scale }}
                >
                  <span className="absolute inset-0 bg-gradient-to-b from-primary/25 to-transparent" />
                  <span className="relative">{ratio}</span>
                </span>
              </span>

              <span className="text-title-md text-on-surface">{info.label}</span>
              <span className="text-label-sm text-muted tabular-nums">
                {`${output.width} x ${output.height}`}
              </span>
              <span className="mt-1 text-body-md text-on-surface-variant">{info.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
