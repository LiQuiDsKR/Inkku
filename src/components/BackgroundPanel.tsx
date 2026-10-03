import { useState } from 'react';
import PanelSheet from './PanelSheet';
import {
  BACKGROUND_COLORS,
  BACKGROUND_GRADIENTS,
  BACKGROUND_TEXTURES,
  gradientBackground,
  photoBlurBackground,
  solidBackground,
  textureBackground,
} from '@/assets/backgroundCatalog';
import { useProjectStore } from '@/store/projectStore';

type BackgroundTab = 'color' | 'gradient' | 'texture';

const TABS: readonly { id: BackgroundTab; label: string }[] = [
  { id: 'color', label: '단색' },
  { id: 'gradient', label: '그라데이션' },
  { id: 'texture', label: '무늬' },
];

interface BackgroundPanelProps {
  onClose: () => void;
}

export default function BackgroundPanel({ onClose }: BackgroundPanelProps) {
  const [tab, setTab] = useState<BackgroundTab>('color');
  const setBackground = useProjectStore((state) => state.setBackground);

  /**
   * 사진 흐리게 배경은 맨 아래 사진을 쓴다.
   * 어떤 사진을 쓸지 고르게 하면 선택 UI가 하나 더 필요한데,
   * 실제로는 대부분 사진 한 장을 놓고 꾸미기 때문에 값어치가 없다.
   */
  const firstPhotoId = useProjectStore((state) => {
    const photo = state.project?.layers.find((layer) => layer.type === 'photo');
    return photo && photo.type === 'photo' ? photo.imageId : null;
  });

  return (
    <PanelSheet title="배경" onClose={onClose} fixedHeight>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-label-lg transition-colors ${
              item.id === tab
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-surface-high text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
        {firstPhotoId && (
          <button
            type="button"
            onClick={() => setBackground(photoBlurBackground(firstPhotoId))}
            className="shrink-0 rounded-full bg-surface-high px-3 py-1.5 text-label-lg text-on-surface-variant"
          >
            사진 흐리게
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 p-4 pt-2">
        {tab === 'color' &&
          BACKGROUND_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setBackground(solidBackground(color))}
              aria-label={`배경 ${color}`}
              style={{ backgroundColor: color }}
              className="aspect-square rounded-2xl border border-white/10 transition-transform active:scale-95"
            />
          ))}

        {tab === 'gradient' &&
          BACKGROUND_GRADIENTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setBackground(gradientBackground(preset))}
              aria-label={`그라데이션 ${preset.id}`}
              style={{
                // CSS와 캔버스의 각도 기준이 달라 90도를 더한다.
                // CSS는 위쪽이 0도이고 Konva는 오른쪽이 0도다.
                background: `linear-gradient(${preset.angle + 90}deg, ${preset.from}, ${preset.to})`,
              }}
              className="aspect-square rounded-2xl border border-white/10 transition-transform active:scale-95"
            />
          ))}

        {tab === 'texture' &&
          BACKGROUND_TEXTURES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setBackground(textureBackground(preset))}
              aria-label={preset.label}
              className="aspect-square overflow-hidden rounded-2xl border border-white/10 transition-transform active:scale-95"
            >
              <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
            </button>
          ))}
      </div>
    </PanelSheet>
  );
}
