/**
 * 아이콘 경로 데이터.
 *
 * 아이콘 폰트(Material Symbols)를 쓰지 않는다. 레퍼런스는 구글 CDN에서 받아 쓰지만
 * 우리는 오프라인에서도 동작해야 하고, 글자 하나가 못 오면 툴바가 통째로 비어 보인다.
 * 인라인 SVG는 번들에 들어가므로 그런 일이 없고 색도 currentColor로 따라온다.
 *
 * 전부 24x24 좌표계에 선으로만 그린다. 채우기를 섞으면 크기가 작아질 때 뭉친다.
 */
export const ICON_PATHS = {
  photo: 'M3 5h18v14H3z M3 16l5-5 3 3 4-4 6 6 M8.5 9.5h.01',
  sticker: 'M20.5 12.5 12.5 20.5 3.5 11.5V3.5h8L20.5 12.5z M16.5 7.5h.01',
  text: 'M5 6h14 M12 6v13 M9 19h6',
  draw: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  shape: 'M12 2.5 16 9H8z M3.5 14.5h7v7h-7z M17.5 14a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  background: 'M3.5 3.5h17v17h-17z M3.5 9.5h17 M9.5 3.5v17',
  layers: 'M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 17l9 5 9-5',
  /*
   * 보조선 버튼은 지금 켜진 눈금을 그대로 보여 준다.
   * 아이콘 하나에 켜짐/꺼짐만 두면 몇 칸짜리인지 눌러 봐야 알 수 있다.
   */
  grid: 'M4 4h16v16H4z',
  grid2: 'M4 4h16v16H4z M12 4v16 M4 12h16',
  grid3: 'M4 4h16v16H4z M9.33 4v16 M14.67 4v16 M4 9.33h16 M4 14.67h16',
  grid4: 'M4 4h16v16H4z M8 4v16 M12 4v16 M16 4v16 M4 8h16 M4 12h16 M4 16h16',
  undo: 'M9 14l-4-4 4-4 M5 10h9a5 5 0 0 1 0 10h-3',
  redo: 'M15 14l4-4-4-4 M19 10h-9a5 5 0 0 0 0 10h3',
  check: 'M4 12l5 5L20 6',
  close: 'M6 6l12 12 M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  flip: 'M12 3v18 M8 8L4 12l4 4 M16 8l4 4-4 4',
  opacity: 'M12 3s6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 6-10 6-10z',
  up: 'M12 19V6 M5 13l7-7 7 7',
  down: 'M12 5v13 M19 11l-7 7-7-7',
  top: 'M4 4h16 M12 21V9 M6 15l6-6 6 6',
  bottom: 'M4 20h16 M12 3v12 M6 9l6 6 6-6',
  sparkle: 'M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7 M12 3v13 M8 7l4-4 4 4',
  download: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2 M12 3v13 M8 11l4 4 4-4',
  ratio: 'M3.5 5.5h17v13h-17z M8 5.5v13',
  plus: 'M12 5v14 M5 12h14',
  adjust: 'M5 21V14 M5 10V3 M12 21v-9 M12 8V3 M19 21v-5 M19 12V3 M2 14h6 M9 8h6 M16 16h6',
  // 템플릿: 머리글과 사진 자리, 글줄이 짜여 있는 카드 한 장
  template: 'M3.5 4.5h17v15h-17z M6.5 8h6v4.5h-6z M15 8.5h3 M15 11.5h3 M6.5 16h11',
  crop: 'M6 2v14a2 2 0 0 0 2 2h14 M2 6h14a2 2 0 0 1 2 2v14',
  // 전체 화면 켜기와 나가기. 모서리 꺾쇠가 바깥을 보면 넓히고 안을 보면 줄인다
  expand: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
  shrink: 'M9 4v5H4 M15 4v5h5 M9 20v-5H4 M15 20v-5h5',
  addBox: 'M4 4h16v16H4z M12 8v8 M8 12h8',
} as const;

export type IconName = keyof typeof ICON_PATHS;
