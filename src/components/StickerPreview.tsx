import { useEffect, useMemo, useRef } from 'react';
import { useElementSize } from './useElementSize';
import { drawTextSticker } from '@/canvas/drawTextSticker';
import { useFontReady } from '@/fonts/useFontReady';
import { STICKER_FONT_SIZE, type TextStickerStyle } from '@/layers/textSticker';
import { layoutTextSticker } from '@/layers/textStickerLayout';

interface StickerPreviewProps {
  text: string;
  style: TextStickerStyle;
  /** 도형만 그린다. 도형과 흐림 견본처럼 모양만 볼 칸에 쓴다. 크기는 글자가 있는 것처럼 잡는다. */
  hideText?: boolean;
  /**
   * 글자가 이 크기(CSS 픽셀)보다 커지지 않는다.
   * 칸에 꽉 채우기만 하면 한 글자짜리 견본은 글자가 칸만 해져서 두께 차이가 안 보인다.
   */
  maxFontPx?: number;
  /** 칸 가장자리 여백 비율. */
  inset?: number;
}

/**
 * 문구 스티커 견본. 칸을 꽉 채우는 캔버스에 실제 스티커를 그린다.
 *
 * 캔버스 레이어와 같은 그리기 함수를 쓴다(`drawTextSticker`). 흐림과 테두리가 붙은 결과와 같아야
 * 견본을 보고 고르는 의미가 있다. 칸 크기를 재서 그 해상도로 그리므로 어느 화면에서도 또렷하다.
 */
export default function StickerPreview({
  text,
  style,
  hideText = false,
  maxFontPx = 40,
  inset = 0.08,
}: StickerPreviewProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useElementSize(wrapRef);

  // 견본마다 제 글꼴을 받는다. 받기 전에는 폴백 글꼴로 그렸다가 도착하면 다시 그린다.
  const fontToken = useFontReady(style.fontId, text);
  const layout = useMemo(
    () => layoutTextSticker(text, style),
    // fontToken은 값을 쓰지 않는다. 폰트가 도착했을 때 다시 재게 하는 신호다.
    [text, style, fontToken],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size || size.width === 0 || size.height === 0) return;

    // 3배를 넘는 화면은 견본에서 차이가 보이지 않는다. 칸이 많아서 메모리를 아낀다.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const box = layout.visualBounds;
    const room = 1 - inset * 2;
    const scale = Math.min(
      maxFontPx / STICKER_FONT_SIZE,
      (size.width * room) / Math.max(1, box.width),
      (size.height * room) / Math.max(1, box.height),
    );

    ctx.setTransform(
      dpr * scale,
      0,
      0,
      dpr * scale,
      dpr * (size.width / 2 - (box.x + box.width / 2) * scale),
      dpr * (size.height / 2 - (box.y + box.height / 2) * scale),
    );
    drawTextSticker(ctx, layout, { hideText });
  }, [layout, size, hideText, maxFontPx, inset]);

  // 칸이 사라지면 픽셀을 돌려준다. 사파리는 캔버스 메모리를 늦게 거둬서 견본이 많으면 한도에 닿는다.
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (!canvas) return;
      canvas.width = 0;
      canvas.height = 0;
    };
  }, []);

  return (
    <span ref={wrapRef} className="block h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </span>
  );
}
