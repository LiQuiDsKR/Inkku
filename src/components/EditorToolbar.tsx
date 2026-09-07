import PhotoImportButton from './PhotoImportButton';
import ToolButton from './ToolButton';
import { useToolStore } from '@/store/toolStore';

/** Phase 3에서 하나씩 연결한다. 6칸이 한 줄에 들어가는지 실기기에서 확인하려고 자리를 미리 잡아 둔다. */
const PENDING_TOOLS = ['그리기', '도형', '배경'] as const;

export default function EditorToolbar() {
  const panel = useToolStore((state) => state.panel);
  const togglePanel = useToolStore((state) => state.togglePanel);
  const openTextEditor = useToolStore((state) => state.openTextEditor);

  return (
    <nav className="safe-bottom relative z-40 flex shrink-0 items-stretch border-t border-ink-line bg-ink-panel">
      <PhotoImportButton />
      <ToolButton
        label="스티커"
        active={panel === 'sticker'}
        onClick={() => togglePanel('sticker')}
      />
      {/* 글자는 패널이 아니라 전체 모달이다. 입력 중에는 캔버스를 볼 필요가 없고, 키보드가 화면 절반을 먹는다 */}
      <ToolButton label="글자" onClick={() => openTextEditor({ mode: 'create' })} />
      {PENDING_TOOLS.map((label) => (
        <ToolButton key={label} label={label} disabled />
      ))}
    </nav>
  );
}
