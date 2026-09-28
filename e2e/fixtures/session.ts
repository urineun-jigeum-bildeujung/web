// 로그인한 상태로 연다. 마이페이지와 하위 화면은 세션이 없으면 로그인으로 보낸다(#447).
//
// 새로고침 뒤와 같은 모양(refreshToken만 있음)을 만든다. 재발급도 함께 받아 둔다 — 스텁이 없는
// 요청(알림 폴링 등)이 로컬 백엔드에서 401을 받으면 가짜 토큰으로 재발급하다 실패해 세션이 지워지고
// 로그인으로 튕긴다. CI는 API 주소가 비어 같은 출처 404로 끝나 이 일이 없어 로컬에서만 흔들린다.
import type { Page } from "@playwright/test";

export async function signIn(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("gollaju.refreshToken", "e2e-refresh-token");
  });
  await page.route("**/api/v1/auths/token/refresh", (route) =>
    route.fulfill({ json: { accessToken: "e2e-access-token", refreshToken: "e2e-refresh-token" } }),
  );
}
