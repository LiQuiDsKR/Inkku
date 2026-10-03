import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useElementSize } from './useElementSize';
import { drawTextSticker } from '@/canvas/drawTextSticker';
import { findFont } from '@/fonts/catalog';
import { useFontReady } from '@/fonts/useFontReady';
import { STICKER_FONT_SIZE, STICKER_LINE_HEIGHT, type TextStickerStyle } from '@/layers/textSticker';
import { layoutTextSticker } from '@/layers/textStickerLayout';

/** 편집 화면에서 글자가 이보다 크게 보이지 않는다. 짧은 문구가 화면을 다 덮으면 뒤의 사진이 안 보인다. */
const MAX_FONT_PX = 36;
const EDGE = 20;

interface StickerEditStageProps {
  text: string;
  style: TextStickerStyle;
  onText: (text: string) => void;
  inputRef: RefObject<HTMLTextAreaElement>;
}

/**
 * 키보드 위로 보이는 높이. iOS는 키보드가 떠도 화면 높이가 줄지 않고 그 위를 덮는다.
 * 그대로 가운데에 두면 스티커가 키보드 뒤에 숨는다.
 */
function useVisibleHeight(ref: RefObject<HTMLElement | null>, deps: unknown): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const measure = () => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const top = viewport ? viewport.offsetTop : 0;
      const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      setHeight(Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top)));
    };

    measure();
    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);
    return () => {
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [ref, deps]);

  return height;
}

/**
 * 편집 화면 가운데의 스티커. 보이는 그림은 캔버스에 붙을 것과 같은 함수로 그린다.
 *
 * 입력칸은 그 위에 투명하게 겹친다. 글자 모달처럼 입력칸 자체를 미리보기로 쓰면 CSS 글자 테두리가
 * 캔버스와 모서리 모양이 달라 굵은 테두리에서 차이가 난다. 입력칸은 같은 글꼴과 같은 크기로
 * 같은 자리에 줄을 놓으므로 커서는 그려진 글자 위에 온다.
 */
export default function StickerEditStage({ text, style, onText, inputRef }: StickerEditStageProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const area = useElementSize(areaRef);
  const visible = useVisibleHeight(areaRef, area);

  const fontToken = useFontReady(style.fontId, text);
  const layout = useMemo(
    () => layoutTextSticker(text, style),
    // fontToken은 값을 쓰지 않는다. 폰트가 도착했을 때 다시 재게 하는 신호다.
    [text, style, fontToken],
  );
  const font = findFont(style.fontId);

  const box = layout.visualBounds;
  const viewHeight = Math.min(area?.height ?? 0, visible ?? Number.POSITIVE_INFINITY);
  const scale = area
    ? Math.max(
        0.04,
        Math.min(
          MAX_FONT_PX / STICKER_FONT_SIZE,
          (area.width - EDGE * 2) / box.width,
          (viewHeight - EDGE * 2) / box.height,
        ),
      )
    : MAX_FONT_PX / STICKER_FONT_SIZE;
  const width = box.width * scale;
  const height = box.height * scale;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -box.x * scale * dpr, -box.y * scale * dpr);
    drawTextSticker(ctx, layout);
  }, [layout, box.x, box.y, width, height, scale]);

  // 칸 폭은 글자가 늘어난 다음 렌더에서야 맞춰진다. 그 사이 입력칸이 옆으로 밀려 있으면 되돌린다.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.scrollLeft = 0;
    input.scrollTop = 0;
  });

  const em = STICKER_FONT_SIZE * scale;
  const lineHeight = em * STICKER_LINE_HEIGHT;
  // 커서가 줄 끝에 설 자리. 가운데 정렬이 어긋나지 않도록 양쪽에 같은 만큼 둔다.
  const slack = em * 0.6;
  const textBox = layout.textBox;
  const caretColor = style.plate && style.plate.opacity >= 0.5 ? style.color : '#ffffff';

  return (
    <div
      ref={areaRef}
      className="relative min-h-0 flex-1 overflow-hidden"
      // 빈 곳을 누르면 다시 입력한다. 탭을 고르다 키보드가 내려갔을 때 칠 곳을 찾지 않게 한다
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) inputRef.current?.focus();
      }}
    >
      <div
        className="absolute left-1/2"
        style={{ top: viewHeight / 2, width, height, transform: 'translate(-50%, -50%)' }}
      >
        <canvas ref={canvasRef} className="block" style={{ width, height }} aria-hidden="true" />
        {text.length === 0 && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-body-lg text-white/50">
            문구 입력
          </span>
        )}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(event) => onText(event.currentTarget.value)}
          rows={1}
          aria-label="문구"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          className="absolute resize-none overflow-hidden whitespace-pre border-0 bg-transparent text-center outline-none selection:bg-white/30"
          style={{
            left: (textBox.x - box.x) * scale - slack,
            top: (textBox.y - box.y) * scale,
            width: textBox.width * scale + slack * 2,
            height: textBox.height * scale + lineHeight,
            padding: `0 ${slack}px`,
            boxSizing: 'border-box',
            fontFamily: font.family,
            fontWeight: font.weight,
            fontSize: em,
            lineHeight: `${lineHeight}px`,
            color: 'transparent',
            // 사파리는 color만으로는 입력칸 글자를 숨기지 않는다
            WebkitTextFillColor: 'transparent',
            caretColor,
          }}
        />
      </div>
    </div>
  );
}
