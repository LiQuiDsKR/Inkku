import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * `npm run dev:tunnel`이 넘기는 --mode tunnel로 터널 접속 여부를 판단한다.
 * 환경변수를 쓰면 윈도우의 npm 스크립트가 cmd로 실행되면서 `TUNNEL=1 vite` 문법이 깨져,
 * cross-env 같은 의존성을 추가해야 한다. Vite 내장 기능으로 끝내는 편이 낫다.
 */
export default defineConfig(({ mode }) => {
  const isTunnel = mode === 'tunnel';

  return {
    /*
     * 배포 경로. GitHub Pages는 저장소 이름이 경로가 된다(https://<계정>.github.io/Inkku/).
     * 배포 워크플로가 BASE_PATH를 넘기고, 개발 서버와 로컬 빌드는 루트에서 돈다.
     * 코드의 에셋 주소는 전부 import.meta.env.BASE_URL을 앞에 붙여서 이 값 하나만 바꾸면 된다.
     */
    base: process.env.BASE_PATH ?? '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // fileURLToPath를 쓰지 않으면 윈도우에서 "/D:/..." 형태가 되어 경로 해석이 깨진다
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // 이 PC는 공유기 NAT 뒤가 아니라 공인 IP를 직접 받는다.
      // host: true로 열면 개발 서버가 사내망이 아니라 인터넷 전체에 노출된다.
      // 터널을 쓸 때는 cloudflared가 localhost로 붙으므로 외부 바인딩이 아예 필요 없다.
      host: isTunnel ? '127.0.0.1' : true,
      port: 5173,
      // Vite 6는 모르는 Host 헤더의 요청을 막는다. 터널 도메인을 명시하지 않으면
      // 폰에서 "Blocked request. This host is not allowed."만 보인다.
      // 와일드카드 대신 터널 모드에서만 열어 평소에는 차단을 유지한다.
      allowedHosts: isTunnel ? ['.trycloudflare.com'] : undefined,
      // 터널 뒤의 클라이언트는 5173이 아니라 443/wss로 접속한다.
      // 그대로 두면 HMR 소켓이 계속 실패해서 수정이 폰에 반영되지 않는다.
      hmr: isTunnel ? { protocol: 'wss', clientPort: 443 } : undefined,
    },
  };
});
