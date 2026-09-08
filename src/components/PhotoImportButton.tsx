import { useRef, useState, type ChangeEvent } from 'react';
import ToolButton from './ToolButton';
import { importPhotos } from '@/layers/importPhotos';
import { getRatioSize } from '@/layers/ratio';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { logDebug } from '@/utils/debugLog';

export default function PhotoImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const ratio = useProjectStore((state) => state.project?.ratio);
  const addLayers = useProjectStore((state) => state.addLayers);
  const peekNextZIndex = useProjectStore((state) => state.peekNextZIndex);
  const select = useSelectionStore((state) => state.select);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = input.files ? Array.from(input.files) : [];
    // 같은 사진을 연달아 고를 수 있도록 값을 비운다. 그대로 두면 change가 다시 뜨지 않는다.
    input.value = '';
    if (files.length === 0 || !ratio) return;

    const size = getRatioSize(ratio);
    setStatus(`0 / ${files.length}`);

    try {
      const layers = await importPhotos({
        files,
        canvasWidth: size.width,
        canvasHeight: size.height,
        startZIndex: peekNextZIndex(),
        onProgress: (done, total) => setStatus(`${done} / ${total}`),
      });
      addLayers(layers);

      // 마지막 장을 선택해 두면 바로 옮길 수 있다
      const last = layers[layers.length - 1];
      if (last) select(last.id);
      setStatus(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logDebug(`사진 불러오기 실패: ${message}`);
      setStatus('사진을 불러오지 못했다');
    }
  };

  return (
    <>
      {status && (
        <div className="glass-panel pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-label-md">
          {status}
        </div>
      )}
      <ToolButton label="사진" icon="photo" onClick={() => inputRef.current?.click()} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void handleChange(event);
        }}
      />
    </>
  );
}
