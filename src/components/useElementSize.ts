import { useLayoutEffect, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * 요소의 화면 크기를 따라간다.
 *
 * 캔버스 견본은 칸 크기를 알아야 그 해상도로 그릴 수 있다. CSS로 늘이면 흐려지고,
 * 고정 크기로 그리면 태블릿처럼 칸이 커지는 화면에서 흐려진다.
 * 같은 값이 다시 오면 상태를 바꾸지 않는다. 바꾸면 견본이 매번 다시 그려진다.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((prev) =>
        prev && prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
