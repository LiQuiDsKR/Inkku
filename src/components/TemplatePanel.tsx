import PanelSheet from './PanelSheet';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';
import { createProjectTemplate } from '@/layers/projectTemplate';
import { useProjectStore } from '@/store/projectStore';
import { TEMPLATE_SPECS, findTemplate } from '@/templates/catalog';
import type { TemplateSpec } from '@/templates/types';

interface TemplatePanelProps {
  onClose: () => void;
}

/**
 * 템플릿 패널.
 *
 * 위는 깔 카드 고르기, 아래는 깔아 둔 카드 고치기다. 둘을 다른 화면으로 나누지 않는다.
 * 카드는 깔자마자 글을 바꾸게 되는데, 그때마다 화면을 옮겨 다니면 손이 두 배로 간다.
 *
 * 카드는 한 장만 깔린다. 배경을 두 개 고를 수 없는 것과 같은 이유다.
 */
export default function TemplatePanel({ onClose }: TemplatePanelProps) {
  const template = useProjectStore((state) => state.project?.template ?? null);
  const setTemplate = useProjectStore((state) => state.setTemplate);

  const spec = template ? findTemplate(template.templateId) : null;

  const handlePick = (picked: TemplateSpec) => {
    // 고른 것을 다시 누르면 걷어 낸다. 빼는 길을 따로 만들지 않아도 되고, 켜고 끄기가 한 손가락이다.
    if (picked.id === template?.templateId) {
      setTemplate(null);
      return;
    }

    const variant = picked.variants[0];
    if (!variant) return;
    setTemplate(createProjectTemplate(picked, variant.id));
  };

  return (
    <PanelSheet title="템플릿" onClose={onClose}>
      <div className="scroll-contain no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3">
        {TEMPLATE_SPECS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handlePick(item)}
            className="flex w-24 shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
          >
            <span
              className={`flex h-28 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 p-1.5 ${
                item.id === template?.templateId
                  ? 'border-primary-container bg-surface-high'
                  : 'border-white/10 bg-surface-low'
              }`}
            >
              {/* 목록도 캔버스와 같은 스펙으로 그린다. 고를 때 본 것과 깔았을 때 나오는 것이 같아야 한다 */}
              <TemplatePreview
                spec={item}
                variantId={item.variants[0]?.id ?? ''}
                className="h-full w-full"
              />
            </span>
            <span
              className={`text-label-md ${
                item.id === template?.templateId ? 'text-on-surface' : 'text-muted'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {template && spec ? (
        <TemplateEditor template={template} spec={spec} />
      ) : (
        <p className="px-4 pb-4 text-body-md text-muted">
          카드를 눌러 깐다. 카드는 배경처럼 캔버스에 맞춰 놓이고, 스티커와 글자는 그 위에 얹힌다.
        </p>
      )}
    </PanelSheet>
  );
}
