import { useCanRedo, useCanUndo } from '@/store/historyStore';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';

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
    <header className="safe-top flex shrink-0 items-center justify-between border-b border-ink-line px-2">
      <button type="button" onClick={onBack} className="px-3 py-3 text-sm">
        뒤로
      </button>

      <div className="flex items-center">
        <HistoryButton label="실행취소" onClick={handleUndo} disabled={!canUndo} />
        <HistoryButton label="다시실행" onClick={handleRedo} disabled={!canRedo} />
        {/* 레이어 목록은 툴바가 아니라 여기에 둔다. 하단 여섯 칸에 더 넣으면 글자가 줄바꿈된다 */}
        <button
          type="button"
          onClick={() => togglePanel('layers')}
          className={`px-2 py-3 text-sm ${panel === 'layers' ? 'text-ink-accent' : 'text-ink-text'}`}
        >
          레이어
        </button>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={exporting}
        className={`px-3 py-3 text-sm font-semibold ${
          exporting ? 'text-ink-muted opacity-40' : 'text-ink-accent'
        }`}
      >
        완료
      </button>
    </header>
  );
}

interface HistoryButtonProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
}

function HistoryButton({ label, onClick, disabled }: HistoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-3 text-sm ${disabled ? 'text-ink-muted opacity-40' : 'text-ink-text'}`}
    >
      {label}
    </button>
  );
}
