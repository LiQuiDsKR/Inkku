import type { TemplateSpec } from './types';

/**
 * 대화 캡처 카드.
 *
 * 진짜 대화를 캡처해 올리면 상대의 이름과 사진이 그대로 나간다.
 * 직접 써 넣는 카드로 두면 보여 주고 싶은 말만 남길 수 있다.
 *
 * 말풍선 색은 역할로만 부른다. 받은 쪽은 slot, 보낸 쪽은 accent다.
 * 그래서 팔레트만 갈아 끼우면 노란 말풍선이 파란 말풍선이 된다.
 */
export const CHAT_TEMPLATE: TemplateSpec = {
  id: 'chat',
  label: '대화 카드',
  width: 560,
  height: 640,

  fields: [
    { id: 'name', label: '상대 이름', value: '스꾸', maxLength: 12 },
    // 말풍선이 글에 맞춰 늘어나므로 상한은 "두 줄까지"를 기준으로 잡는다.
    // 세 줄이 되면 아래 말풍선과 겹친다.
    { id: 'message1', label: '받은 말 1', value: '오늘 사진 진짜 잘 나왔다', maxLength: 24 },
    { id: 'message2', label: '보낸 말', value: '내가 찍어서 그렇지', maxLength: 24 },
    { id: 'message3', label: '받은 말 2', value: '어이가 없네', maxLength: 24 },
  ],

  slots: [
    { id: 'avatar', label: '프로필 사진' },
    { id: 'photo', label: '보낸 사진' },
  ],

  variants: [
    {
      id: 'kakao',
      label: '노랑',
      palette: {
        card: '#b2c7d9',
        ink: '#1a1a1a',
        inkMuted: '#5b6b7a',
        accent: '#fae100',
        onAccent: '#1a1a1a',
        slot: '#ffffff',
        divider: '#00000014',
        chip: '#a7bdd0',
        onChip: '#16222c',
      },
    },
    {
      id: 'blue',
      label: '파랑',
      palette: {
        card: '#f2f4f7',
        ink: '#1a1a1a',
        inkMuted: '#8a8a8f',
        accent: '#3b7ff5',
        onAccent: '#ffffff',
        slot: '#e6e6eb',
        divider: '#00000014',
        chip: '#ffffff',
        onChip: '#1a1a1a',
      },
    },
    {
      id: 'dark',
      label: '다크',
      palette: {
        card: '#1b1b1f',
        ink: '#f0f0f2',
        inkMuted: '#8b8b94',
        accent: '#fae100',
        onAccent: '#1a1a1a',
        slot: '#2c2c33',
        divider: '#ffffff1a',
        chip: '#232329',
        onChip: '#f0f0f2',
      },
    },
  ],

  parts: [
    { kind: 'rect', x: 0, y: 0, width: 560, height: 640, radius: 28, fill: 'card', shadow: 26 },
    { kind: 'rect', x: 0, y: 0, width: 560, height: 92, radius: [28, 28, 0, 0], fill: 'chip' },
    { kind: 'icon', icon: 'back', x: 22, y: 32, size: 28, fill: 'onChip' },
    {
      kind: 'text',
      field: 'name',
      x: 62,
      y: 40,
      width: 300,
      size: 27,
      weight: 600,
      fill: 'onChip',
    },
    { kind: 'icon', icon: 'menu', x: 508, y: 33, size: 26, fill: 'onChip' },

    { kind: 'slot', slot: 'avatar', x: 26, y: 124, width: 74, height: 74, radius: 37 },

    // 말풍선 꼬리는 모서리 하나만 덜 깎아서 만든다. 삼각형을 따로 그리지 않아도 방향이 읽힌다
    {
      kind: 'bubble',
      field: 'message1',
      side: 'left',
      x: 114,
      y: 124,
      maxWidth: 350,
      size: 24,
      padX: 22,
      padY: 21,
      radius: [6, 22, 22, 22],
      fill: 'slot',
      textFill: 'ink',
      time: '오후 4:12',
      timeFill: 'inkMuted',
    },
    {
      kind: 'bubble',
      field: 'message2',
      side: 'right',
      x: 534,
      y: 236,
      maxWidth: 350,
      size: 24,
      padX: 22,
      padY: 21,
      radius: [22, 6, 22, 22],
      fill: 'accent',
      textFill: 'onAccent',
      time: '오후 4:13',
      timeFill: 'inkMuted',
    },
    {
      kind: 'bubble',
      field: 'message3',
      side: 'left',
      x: 114,
      y: 348,
      maxWidth: 350,
      size: 24,
      padX: 22,
      padY: 21,
      radius: [6, 22, 22, 22],
      fill: 'slot',
      textFill: 'ink',
      time: '오후 4:15',
      timeFill: 'inkMuted',
    },

    { kind: 'slot', slot: 'photo', x: 300, y: 456, width: 220, height: 156, radius: 20 },
    { kind: 'text', text: '오후 4:16', x: 212, y: 584, size: 18, fill: 'inkMuted' },
  ],
};
