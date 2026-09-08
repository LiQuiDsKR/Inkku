import Icon from './icons/Icon';
import type { ExportController } from '@/export/useExport';
import type { ExportFormat } from '@/export/renderProject';

interface ExportScreenProps {
  exporter: ExportController;
}

const FORMATS: readonly { id: ExportFormat; label: string; detail: string }[] = [
  { id: 'jpeg', label: 'JPG', detail: '가벼운 용량' },
  { id: 'png', label: 'PNG', detail: '또렷한 경계' },
];

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`;
}

/**
 * 내보내기 결과 화면.
 *
 * 완료를 누르자마자 공유 시트를 띄우지 않는다. 무엇이 나갔는지 눈으로 확인하고
 * 저장할지 공유할지 고르게 한다. 잘못 나간 그림을 인스타에 올린 뒤에 알아채는 것이 최악이다.
 */
export default function ExportScreen({ exporter }: ExportScreenProps) {
  const { result } = exporter;
  if (!result) return null;

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-surface">
      <header className="flex shrink-0 items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={exporter.close}
          aria-label="에디터로 돌아가기"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-on-surface transition-transform active:scale-90"
        >
          <Icon name="back" size={18} />
        </button>
        <span className="text-title-md text-on-surface">내보내기</span>
        <span className="h-9 w-9" />
      </header>

      <div className="scroll-contain min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex items-center gap-2 rounded-full bg-surface-container px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(64,226,168,0.8)]" />
          <span className="text-label-lg text-on-surface">렌더링 완료</span>
          <span className="ml-auto rounded-full bg-surface-high px-2 py-0.5 text-label-sm text-on-surface-variant tabular-nums">
            {`${result.width} x ${result.height}`}
          </span>
        </div>

        {/* 실제로 저장될 그림 그대로다. 캔버스를 다시 그린 결과라 화면에서 본 것과 다를 수 있다 */}
        <div className="mt-4 overflow-hidden rounded-3xl bg-surface-lowest">
          <img src={result.previewUrl} alt="내보낼 그림" className="w-full" />
        </div>

        <p className="mt-4 text-label-md text-muted">파일 형식</p>
        <div className="mt-2 flex gap-2">
          {FORMATS.map((format) => {
            const active = format.id === result.format;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => exporter.run(format.id)}
                disabled={exporter.busy}
                className={`flex flex-1 flex-col items-start rounded-2xl px-4 py-3 transition-transform active:scale-95 ${
                  active
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="text-title-md">{format.label}</span>
                <span className="text-label-md opacity-80">{format.detail}</span>
              </button>
            );
          })}
          <span className="flex flex-col justify-center rounded-2xl bg-surface-container px-4 text-label-md text-muted tabular-nums">
            {formatSize(result.blob.size)}
          </span>
        </div>

        <button
          type="button"
          onClick={exporter.share}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-4 text-title-md text-on-primary-container shadow-[0_8px_24px_-8px_rgba(255,83,118,0.8)] transition-transform active:scale-[0.98]"
        >
          <Icon name="share" size={18} />
          공유하기
        </button>

        <button
          type="button"
          onClick={exporter.save}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-surface-bright py-4 text-title-md text-on-surface transition-transform active:scale-[0.98]"
        >
          <Icon name="download" size={18} />
          파일로 저장하기
        </button>

        {/*
          아이폰에는 다운로드 폴더가 없다. 공유 시트의 "이미지 저장"이 사진 앱으로 가는 유일한 길이라
          저장 버튼이 기대와 다르게 동작할 수 있다는 것을 미리 알린다.
        */}
        <p className="mt-4 rounded-2xl bg-surface-container p-4 text-body-md text-on-surface-variant">
          아이폰이라면 공유하기를 눌러 사진 앱에 저장한다. 파일로 저장하기는 안드로이드와 PC에서
          바로 내려받는 경로다.
        </p>
      </div>
    </div>
  );
}
