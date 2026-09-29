import { useRef } from 'react';
import Icon from './icons/Icon';
import { useTemplateSlotPicker } from './useTemplateSlotPicker';
import { withField } from '@/layers/projectTemplate';
import { useProjectStore } from '@/store/projectStore';
import { fieldValue } from '@/templates/types';
import type { ProjectTemplate } from '@/layers/types';
import type { TemplateSpec } from '@/templates/types';

interface TemplateEditorProps {
  template: ProjectTemplate;
  spec: TemplateSpec;
}

/**
 * 고른 카드의 내용을 고치는 곳.
 *
 * 글은 캔버스에서 바로 고치지 않는다. 카드 안의 글은 자리마다 크기와 색이 정해져 있어서
 * 캔버스에서 두드리면 어느 줄을 고치는지 알기 어렵고, 키보드가 카드를 가린다.
 */
export default function TemplateEditor({ template, spec }: TemplateEditorProps) {
  const updateTemplate = useProjectStore((state) => state.updateTemplate);
  const picker = useTemplateSlotPicker();

  /**
   * 지금 치고 있는 칸.
   * 한 글자마다 히스토리에 남기면 한 문장에 30단계가 다 차서 실행취소가 쓸모없어진다.
   * 칸이 바뀌는 순간에만 기록한다(투명도 슬라이더와 같은 규칙이다).
   */
  const typingField = useRef<string | null>(null);

  const handleField = (fieldId: string, value: string) => {
    const record = typingField.current !== fieldId;
    typingField.current = fieldId;
    updateTemplate({ fields: withField(template, fieldId, value) }, record);
  };

  return (
    <div className="px-4 pb-5">
      <p className="pb-2 text-label-md text-muted">레이아웃</p>
      <div className="scroll-contain no-scrollbar flex gap-2 overflow-x-auto pb-4">
        {spec.variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => updateTemplate({ variantId: variant.id })}
            className={`shrink-0 rounded-full px-4 py-2 text-label-lg transition-colors ${
              variant.id === template.variantId
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-high text-on-surface-variant'
            }`}
          >
            {variant.label}
          </button>
        ))}
      </div>

      <p className="pb-2 text-label-md text-muted">글</p>
      <div className="flex flex-col gap-2 pb-4">
        {spec.fields.map((field) => (
          <label key={field.id} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-label-lg text-on-surface-variant">
              {field.label}
            </span>
            <input
              type="text"
              value={fieldValue(spec, template.fields, field.id)}
              maxLength={field.maxLength}
              onChange={(event) => handleField(field.id, event.currentTarget.value)}
              // 칸을 떠나면 다음 입력은 새 단계로 기록한다
              onBlur={() => {
                typingField.current = null;
              }}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-surface-container px-3 py-2.5 text-body-lg text-on-surface outline-none focus:border-primary-container"
            />
          </label>
        ))}
      </div>

      <p className="pb-2 text-label-md text-muted">사진</p>
      <div className="flex flex-col gap-2">
        {spec.slots.map((slot) => {
          const filled = Boolean(template.slots[slot.id]);
          return (
            <div key={slot.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => picker.open(slot.id)}
                disabled={picker.busy}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-label-lg transition-transform active:scale-95 ${
                  filled
                    ? 'bg-surface-high text-on-surface'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed'
                } ${picker.busy ? 'opacity-50' : ''}`}
              >
                <Icon name={filled ? 'photo' : 'plus'} size={16} />
                <span className="truncate">{slot.label}</span>
                <span className="ml-auto shrink-0 text-label-md opacity-70">
                  {filled ? '바꾸기' : '넣기'}
                </span>
              </button>
              {filled && (
                <button
                  type="button"
                  onClick={() => picker.clear(slot.id)}
                  aria-label={`${slot.label} 비우기`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-transform active:scale-90"
                >
                  <Icon name="close" size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={picker.inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void picker.handleChange(event);
        }}
      />
    </div>
  );
}
