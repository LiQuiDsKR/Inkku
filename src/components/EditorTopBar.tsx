import Icon from './icons/Icon';
import SaveStatusChip from './SaveStatusChip';
import { useCanRedo, useCanUndo } from '@/store/historyStore';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useSettingsStore, type GridKind } from '@/store/settingsStore';
import { useToolStore } from '@/store/toolStore';
import type { IconName } from './icons/paths';

/** 보조선 버튼에 그릴 아이콘과 읽어 줄 이름. 눌렀을 때 무엇이 되는지 버튼이 스스로 보여 준다. */
const GRID_FACE: Record<GridKind, { icon: IconName; label: string }> = {
  none: { icon: 'grid', label: '보조선 없음' },
  '2x2': { icon: 'grid2', label: '보조선 2칸' },
  '3x3': { icon: 'grid3', label: '보조선 3칸' },
  '4x4': { icon: 'grid4', label: '보조선 4칸' },
};

interface EditorTopBarProps {
  onBack: () => void;
  onExport: () => void;
  exporting: boolean;
}

export default function EditorTopBar({ onBack, onExport, exporting }: EditorTopBarProps) {
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const clearSelection = useSelectionStore((state) => state.clear);
  const panel = useToolStore((state) => state.panel);
  const togglePanel = useToolStore((state) => state.togglePanel);
  const grid = useSettingsStore((state) => state.grid);
  const cycleGrid = useSettingsStore((state) => state.cycleGrid);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  /**
   * 되돌린 뒤에는 선택을 푼다.
   * 되돌리기로 사라진 레이어가 선택된 채로 남으면 Transformer가 없는 노드를 잡고 있게 되고,
   * 컨텍스트 바도 사라진 레이어를 계속 가리킨다.
   */
  const handleUndo = () => {
    undo();
    clearSelection();
  };

  const handleRedo = () => {
    redo();
    clearSelection();
  };

  return (
    <header className="safe-top z-40 flex shrink-0 items-center justify-between gap-2 bg-surface-low px-3 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <RoundButton icon="back" label="뒤로" onClick={onBack} />
        <RoundButton icon="undo" label="실행취소" onClick={handleUndo} disabled={!canUndo} />
        <RoundButton icon="redo" label="다시실행" onClick={handleRedo} disabled={!canRedo} />
        <SaveStatusChip />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={cycleGrid}
          aria-label={GRID_FACE[grid].label}
          title={GRID_FACE[grid].label}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90 ${
            grid === 'none'
              ? 'bg-surface-high text-on-surface-variant'
              : 'bg-tertiary-fixed text-on-tertiary-fixed'
          }`}
        >
          <Icon name={GRID_FACE[grid].icon} size={18} />
        </button>
        <button
          type="button"
          onClick={() => togglePanel('layers')}
          aria-label="레이어 목록"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90 ${
            panel === 'layers'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-high text-on-surface'
          }`}
        >
          <Icon name="layers" size={18} />
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-title-md whitespace-nowrap transition-transform active:scale-95 ${
            exporting
              ? 'bg-surface-high text-muted'
              : 'bg-primary-container text-on-primary-container shadow-md'
          }`}
        >
          {/* "완료"라고 쓰면 지금 고친 요소 하나를 확정하는 버튼으로 읽힌다. 실제로는 결과물을 굽는다 */}
          <Icon name="share" size={16} />
          내보내기
        </button>
      </div>
    </header>
  );
}

interface RoundButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** 44px 원형 버튼은 폰에서 확실히 눌린다. 36px 아래로 내려가면 자꾸 빗나간다. */
function RoundButton({ icon, label, onClick, disabled = false }: RoundButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface-high transition-transform active:scale-90 ${
        disabled ? 'text-muted opacity-40' : 'text-on-surface'
      }`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
