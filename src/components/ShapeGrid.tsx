import { SHAPE_KINDS, type ShapeKind } from '@/layers/shapeCatalog';
import { SHAPE_BASE_SIZE } from '@/layers/shapeStyle';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';

/** 견본 둘레 여백. 칸 끝까지 채우면 모서리가 뾰족한 도형이 잘려 보인다. */
const PAD = 24;
const VIEW = `${-PAD} ${-PAD} ${SHAPE_BASE_SIZE + PAD * 2} ${SHAPE_BASE_SIZE + PAD * 2}`;

interface ShapeGridProps {
  color: string;
  onPick: (shape: ShapeKind) => void;
}

/**
 * 도형 목록.
 *
 * 이름이 아니라 모양을 보여 준다. "평행사변형"이나 "톱니"는 글로 읽어서는 어떤 모양인지
 * 눌러 보기 전까지 알 수 없다. 이름은 화면 읽기 도구를 위해 aria-label로만 남긴다.
 */
export default function ShapeGrid({ color, onPick }: ShapeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 p-4 pt-2">
      {SHAPE_KINDS.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => onPick(item.kind)}
          aria-label={item.label}
          className="flex aspect-square items-center justify-center rounded-xl p-2 transition-transform active:scale-95"
          style={{ background: VECTOR_TILE_BACKGROUND }}
        >
          <svg viewBox={VIEW} className="h-full w-full" aria-hidden="true" focusable="false">
            <path d={item.path} fill={color} />
          </svg>
        </button>
      ))}
    </div>
  );
}
