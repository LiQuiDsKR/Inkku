import { SHAPE_COLORS } from '@/layers/shapeStyle';

interface ColorRowProps {
  color: string;
  onColor: (color: string) => void;
}

/** 도형, 파티클, 한 가지 색 에셋이 함께 쓰는 색 줄. 같은 팔레트라 결과물의 색이 겉돌지 않는다. */
export default function ColorRow({ color, onColor }: ColorRowProps) {
  return (
    <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
      {SHAPE_COLORS.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onColor(item)}
          aria-label={`색 ${item}`}
          style={{ backgroundColor: item }}
          className={`h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
            item === color ? 'border-primary-container' : 'border-white/10'
          }`}
        />
      ))}
    </div>
  );
}
