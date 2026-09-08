import { useEffect, useState } from 'react';
import { getImage } from '@/storage/imageStore';
import { logDebug } from '@/utils/debugLog';
import type { Project } from '@/layers/types';

interface ProjectThumbnailProps {
  project: Project;
  className?: string;
}

/**
 * 저장된 작업물의 미리보기.
 *
 * 프로젝트 전체를 다시 렌더링하지 않고 맨 아래 사진 한 장만 보여 준다.
 * 홈 화면을 열 때마다 캔버스를 세워 그리는 것은 비싸고, 어떤 작업물인지 알아보는 데는
 * 배경이 된 사진 한 장이면 충분하다.
 */
export default function ProjectThumbnail({ project, className }: ProjectThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);

  const photo = project.layers.find((layer) => layer.type === 'photo');
  const imageId = photo && photo.type === 'photo' ? photo.imageId : null;

  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let alive = true;

    getImage(imageId)
      .then((record) => {
        if (!record || !alive) return;
        objectUrl = URL.createObjectURL(record.blob);
        setUrl(objectUrl);
      })
      .catch((error: unknown) => {
        logDebug(error instanceof Error ? error.message : String(error));
      });

    return () => {
      alive = false;
      // 화면에서 사라진 뒤에도 URL을 붙들고 있으면 Blob이 메모리에 남는다
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (!url) {
    // 사진 없이 도형과 글자만 있는 작업물도 있다. 빈 칸 대신 바탕을 깐다.
    return (
      <div
        className={className}
        style={{ background: 'linear-gradient(135deg, #2a2a2a, #1c1b1b)' }}
      />
    );
  }

  return <img src={url} alt="" className={className} />;
}
