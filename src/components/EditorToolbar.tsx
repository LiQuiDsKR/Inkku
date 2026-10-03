import PhotoImportButton from './PhotoImportButton';
import ToolButton from './ToolButton';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore } from '@/store/toolStore';

export default function EditorToolbar() {
  const panel = useToolStore((state) => state.panel);
  const togglePanel = useToolStore((state) => state.togglePanel);
  const openTextEditor = useToolStore((state) => state.openTextEditor);
  const clearSelection = useSelectionStore((state) => state.clear);

  /**
   * 그리기로 들어갈 때는 선택을 푼다.
   * 선택된 레이어가 남아 있으면 Transformer 핸들이 캔버스 위에 떠 있어서
   * 그 자리를 지나는 획이 끊긴 것처럼 보인다.
   */
  const handleDraw = () => {
    clearSelection();
    togglePanel('draw');
  };

  return (
    <nav className="safe-bottom glass relative z-40 flex shrink-0 items-stretch px-2 pt-1.5">
      <PhotoImportButton />
      {/* 스티커, 꾸밈선, 도형은 "붙일 것"이라는 한 목적이라 한 패널에 모았다 */}
      <ToolButton
        label="요소"
        icon="sticker"
        active={panel === 'element'}
        onClick={() => togglePanel('element')}
      />
      {/* 글자는 패널이 아니라 전체 모달이다. 입력 중에는 캔버스를 볼 필요가 없고, 키보드가 화면 절반을 먹는다 */}
      <ToolButton label="텍스트" icon="text" onClick={() => openTextEditor({ mode: 'create' })} />
      <ToolButton label="그리기" icon="draw" active={panel === 'draw'} onClick={handleDraw} />
      <ToolButton
        label="템플릿"
        icon="template"
        active={panel === 'template'}
        onClick={() => togglePanel('template')}
      />
      <ToolButton
        label="배경"
        icon="background"
        active={panel === 'background'}
        onClick={() => togglePanel('background')}
      />
    </nav>
  );
}
