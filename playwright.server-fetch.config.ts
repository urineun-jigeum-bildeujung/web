// 서버 컴포넌트가 직접 백엔드를 부르는 화면 전용 E2E 설정(#282).
//
// 브라우저 page.route()는 Next 서버 프로세스가 보내는 요청을 못 가로챈다. 그래서 이
// 설정은 기존 dev 서버(3000)를 재사용하지 않고, 목 API 서버와 전용 포트의 Next 서버를
// 새로 띄워 API_BASE_URL_INTERNAL이 목 서버를 가리키게 한다 — 기존 `playwright.config.ts`
// 스위트(브라우저 레벨 스텁)와 절대 섞이지 않는다.
//
// NEXT_PUBLIC_API_BASE_URL도 같은 목 서버를 가리킨다(#289). 홈 카테고리 그리드의
// "더 보기"는 브라우저에서 직접 getProducts를 다시 부르는데, 이 값이 없으면
// shared/api/client의 same-origin 기본값(/api/v1)으로 가 이 Next 앱 자신에게 요청을
// 보내 404가 난다 — 실제 배포에서는 같은 오리진 뒤에 게이트웨이가 있다고 가정하는
// 값이라, 로컬 목 서버 환경에서는 명시적으로 채워 줘야 한다.
import { defineConfig, devices } from "@playwright/test";

const MOCK_API_PORT = 4010;
const APP_PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/*.server-fetch.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    // Next dev 서버는 기본적으로 localhost 외의 출처(127.0.0.1 포함)에서 오는 개발
    // 리소스 요청을 막는다(next.config.ts의 allowedDevOrigins 주석과 같은 이유) —
    // 그래서 앱 쪽만 localhost를 쓴다. 목 API 서버는 이 제약이 없어 127.0.0.1 그대로 둔다
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-api-server.mjs",
      url: `http://127.0.0.1:${MOCK_API_PORT}/health`,
      reuseExistingServer: false,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
    },
    {
      command: `npm run dev -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      env: {
        API_BASE_URL_INTERNAL: `http://127.0.0.1:${MOCK_API_PORT}/api/v1`,
        NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${MOCK_API_PORT}/api/v1`,
      },
    },
  ],
});
