import ParticlePreview from './ParticlePreview';
import { VECTOR_TILE_BACKGROUND } from './vectorTile';
import { PARTICLE_SHAPES, type ParticleKind } from '@/layers/particleCatalog';

interface ParticleGridProps {
  color: string;
  onPick: (kind: ParticleKind) => void;
}

/** 파티클 목록. 흩뿌린 모양을 그대로 보여 준다. 이름만으로는 밀도와 크기를 알 수 없다. */
export default function ParticleGrid({ color, onPick }: ParticleGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4 pt-2">
      {PARTICLE_SHAPES.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => onPick(item.kind)}
          className="flex flex-col items-center gap-1 transition-transform active:scale-95"
        >
          <span
            className="flex aspect-square w-full items-center justify-center rounded-xl p-1"
            style={{ background: VECTOR_TILE_BACKGROUND }}
          >
            <ParticlePreview shape={item} color={color} className="h-full w-full" />
          </span>
          <span className="text-label-md text-muted">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
