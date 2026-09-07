import PhotoImportButton from './PhotoImportButton';
import ToolButton from './ToolButton';

/** Phase 2와 3에서 하나씩 연결한다. 지금 6칸을 다 그려야 한 줄에 들어가는지 실기기에서 확인된다. */
const PENDING_TOOLS = ['스티커', '글자', '그리기', '도형', '배경'] as const;

export default function EditorToolbar() {
  return (
    <nav className="safe-bottom relative flex shrink-0 items-stretch border-t border-ink-line bg-ink-panel">
      <PhotoImportButton />
      {PENDING_TOOLS.map((label) => (
        <ToolButton key={label} label={label} disabled />
      ))}
    </nav>
  );
}
