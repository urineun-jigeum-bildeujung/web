// 알림함 API 스텁. 알림 목록 화면이 서버에서 받는다(#354). 백엔드가 떠 있느냐에 흔들리지 않게 세운다.
import type { Page } from "@playwright/test";

export async function stubNotifications(page: Page) {
  await page.route("**/api/v1/notifications?*", (route) =>
    route.fulfill({ json: { content: [] } }),
  );
  await page.route("**/api/v1/notifications", (route) => route.fulfill({ json: { content: [] } }));
}
