import { useRef, useState, type ChangeEvent } from 'react';
import { withSlot } from '@/layers/projectTemplate';
import { putImage } from '@/storage/imageStore';
import { useProjectStore } from '@/store/projectStore';
import { logDebug } from '@/utils/debugLog';
import { createId } from '@/utils/id';
import { resizeImageFile } from '@/utils/imageResize';
import type { ProjectTemplate } from '@/layers/types';

/** 비동기 사이에 카드가 걷혔거나 다른 카드로 바뀌었을 수 있다. 쓰기 직전에 스토어에서 다시 읽는다. */
function readTemplate(): ProjectTemplate | null {
  return useProjectStore.getState().project?.template ?? null;
}

/**
 * 템플릿의 사진 자리를 채우는 흐름.
 *
 * 캔버스의 더하기 표시와 패널의 버튼이 같은 일을 한다. 로직을 두 벌 두면 한쪽만 고치는 실수가 나서
 * 훅으로 묶는다. 파일 입력은 쓰는 쪽이 하나씩 그린다(숨은 input이라 자리를 차지하지 않는다).
 */
export function useTemplateSlotPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  // 어느 자리를 채우는 중인지. 화면에 그릴 값이 아니라 ref로 둔다.
  const target = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);

  const updateTemplate = useProjectStore((state) => state.updateTemplate);

  const open = (slotId: string): void => {
    target.current = slotId;
    inputRef.current?.click();
  };

  const clear = (slotId: string): void => {
    const template = readTemplate();
    if (template) updateTemplate({ slots: withSlot(template, slotId, null) });
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    // 같은 사진을 연달아 고를 수 있도록 값을 비운다. 그대로 두면 change가 다시 뜨지 않는다.
    input.value = '';

    const slotId = target.current;
    target.current = null;
    if (!file || !slotId) return;

    setBusy(true);
    try {
      const resized = await resizeImageFile(file);
      const imageId = createId();
      await putImage({
        id: imageId,
        blob: resized.blob,
        width: resized.width,
        height: resized.height,
        createdAt: Date.now(),
      });

      const template = readTemplate();
      if (template) updateTemplate({ slots: withSlot(template, slotId, imageId) });
    } catch (error: unknown) {
      logDebug(`카드 사진 넣기 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return { inputRef, open, clear, busy, handleChange };
}
