// 알림함 API 스텁. 알림 목록 화면이 서버에서 받는다(#354). 백엔드가 떠 있느냐에 흔들리지 않게 세운다.
import type { Page } from "@playwright/test";

export async function stubNotifications(page: Page) {
  await page.route("**/api/v1/notifications?*", (route) =>
    route.fulfill({ json: { content: [] } }),
  );
  await page.route("**/api/v1/notifications", (route) => route.fulfill({ json: { content: [] } }));
}

/**
 * 타임딜 알림 구독 스텁(#644). 서버처럼 값을 기억해 PUT이 바꾸고 GET이 돌려준다 — 새로고침해도
 * 신청 상태가 남는지 볼 수 있다. 받은 PUT 본문을 모아 무엇을 보냈는지도 본다.
 */
export async function stubTimeDealSubscription(page: Page, initial = false) {
  const state = { subscribed: initial, puts: [] as unknown[] };
  await page.route("**/api/v1/notifications/subscriptions/TIME_DEAL", (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON() as { subscribed: boolean };
      state.puts.push(body);
      state.subscribed = body.subscribed;
    }
    return route.fulfill({ json: { category: "TIME_DEAL", subscribed: state.subscribed } });
  });
  return state;
}
