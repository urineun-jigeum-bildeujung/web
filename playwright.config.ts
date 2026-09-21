import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // 서버 컴포넌트가 직접 백엔드를 부르는 화면은 이 dev 서버(3000)로 못 검증한다
  // (page.route()가 서버 프로세스 요청을 못 가로챔) — 전용 설정(playwright.server-fetch.config.ts)이 따로 맡는다
  testIgnore: ["**/*.server-fetch.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
