import { Rect } from 'react-konva';
import { findFrame } from '@/layers/photoFrame';
import type { FrameStyle } from '@/layers/photoFrame';

/**
 * 사진 프레임의 그리기.
 *
 * 종이(사진 뒤)와 장식(사진 위)을 나눠 그린다. Konva는 적은 순서대로 겹치므로
 * 사진을 사이에 두려면 컴포넌트가 둘로 갈라져 있어야 한다.
 * 무엇을 그릴지는 `layers/photoFrame.ts`의 프리셋이 정하고, 여기는 그 값을 노드로 옮긴다.
 */

/** 종이 느낌을 내는 그림자. 값이 고정이라 필터와 달리 캐시가 필요 없다. */
const PAPER_SHADOW = 'rgba(0,0,0,0.35)';

interface FrameGeometry {
  style: FrameStyle;
  color: string;
  /** 종이를 포함한 전체 크기. */
  width: number;
  height: number;
  /** 사진이 놓인 자리. 장식은 이 사각형을 기준으로 그린다. */
  photoX: number;
  photoY: number;
  photoWidth: number;
  photoHeight: number;
}

/** 두께와 간격의 기준. 사진이 커지면 장식도 같은 비율로 커진다. */
function baseOf(geometry: FrameGeometry): number {
  return Math.min(geometry.photoWidth, geometry.photoHeight);
}

export function PhotoFrameBack(geometry: FrameGeometry) {
  const preset = findFrame(geometry.style);
  if (!preset.paper) return null;

  const radius = geometry.width * (preset.radius ?? 0);

  return (
    <Rect
      width={geometry.width}
      height={geometry.height}
      cornerRadius={radius}
      fill={geometry.color}
      shadowColor={PAPER_SHADOW}
      shadowBlur={geometry.width * 0.02}
      shadowOffsetY={geometry.width * 0.006}
    />
  );
}

/** 필름 구멍. 긴 변을 따라 늘어놓는다. 짧은 변에 넣으면 두세 개만 들어가 필름으로 안 보인다. */
function FilmHoles(geometry: FrameGeometry) {
  const band = (geometry.height - geometry.photoHeight) / 2;
  const horizontal = geometry.width >= geometry.height;

  const holeLong = band * 0.62;
  const holeShort = band * 0.34;
  const gap = holeLong * 1.9;

  const along = horizontal ? geometry.width : geometry.height;
  const count = Math.max(2, Math.floor(along / gap) - 1);
  const start = (along - (count - 1) * gap) / 2;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const offset = start + index * gap;
        const size = horizontal
          ? { width: holeLong, height: holeShort }
          : { width: holeShort, height: holeLong };

        // 위아래(또는 좌우) 두 줄을 한 번에 만든다
        return [0, 1].map((side) => {
          const near = band / 2 - (horizontal ? size.height : size.width) / 2;
          const far = (horizontal ? geometry.height : geometry.width) - band / 2 -
            (horizontal ? size.height : size.width) / 2;

          return (
            <Rect
              key={`${index}-${side}`}
              x={horizontal ? offset - size.width / 2 : side === 0 ? near : far}
              y={horizontal ? (side === 0 ? near : far) : offset - size.height / 2}
              width={size.width}
              height={size.height}
              cornerRadius={holeShort * 0.35}
              fill="#f4f2ec"
              opacity={0.92}
            />
          );
        });
      })}
    </>
  );
}

/** 사진 안쪽에 긋는 선. 빈티지의 실선, 골드의 두 줄, 점선이 전부 이 모양이다. */
interface InnerLineProps {
  geometry: FrameGeometry;
  inset: number;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  radius?: number;
}

function InnerLine({ geometry, inset, stroke, strokeWidth, dash, radius }: InnerLineProps) {
  return (
    <Rect
      x={geometry.photoX + inset}
      y={geometry.photoY + inset}
      width={geometry.photoWidth - inset * 2}
      height={geometry.photoHeight - inset * 2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      dash={dash}
      cornerRadius={radius}
      listening={false}
    />
  );
}

/** 모서리에 붙인 테이프 두 조각. 대각선으로 마주 보게 붙여야 사진을 붙여 둔 것처럼 보인다. */
function TapeStrips(geometry: FrameGeometry) {
  const base = baseOf(geometry);
  const length = base * 0.36;
  const thickness = base * 0.11;

  const corners = [
    { x: geometry.photoX, y: geometry.photoY },
    {
      x: geometry.photoX + geometry.photoWidth,
      y: geometry.photoY + geometry.photoHeight,
    },
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <Rect
          key={index}
          x={corner.x}
          y={corner.y}
          width={length}
          height={thickness}
          offsetX={length / 2}
          offsetY={thickness / 2}
          rotation={-45}
          // 반투명이라야 아래 사진이 비쳐 테이프로 읽힌다. 불투명하면 그냥 붙인 막대다.
          fill="#fffaf0"
          opacity={0.62}
          stroke="#e6d9c2"
          strokeWidth={thickness * 0.06}
          listening={false}
        />
      ))}
    </>
  );
}

export function PhotoFrameFront(geometry: FrameGeometry) {
  const base = baseOf(geometry);

  switch (geometry.style) {
    case 'vintage':
      return (
        <InnerLine
          geometry={geometry}
          inset={-base * 0.018}
          stroke="#b9a888"
          strokeWidth={base * 0.005}
        />
      );

    case 'film':
      return <FilmHoles {...geometry} />;

    case 'gold':
      return (
        <>
          <InnerLine
            geometry={geometry}
            inset={base * 0.03}
            stroke="#e0bd6b"
            strokeWidth={base * 0.013}
          />
          <InnerLine
            geometry={geometry}
            inset={base * 0.055}
            stroke="#e0bd6b"
            strokeWidth={base * 0.004}
          />
        </>
      );

    case 'dashed':
      return (
        <InnerLine
          geometry={geometry}
          inset={base * 0.04}
          stroke="#ffffff"
          strokeWidth={base * 0.009}
          dash={[base * 0.035, base * 0.028]}
          radius={base * 0.02}
        />
      );

    case 'tape':
      return <TapeStrips {...geometry} />;

    default:
      // 종이만 있는 프레임은 사진 위에 그릴 것이 없다
      return null;
  }
}
