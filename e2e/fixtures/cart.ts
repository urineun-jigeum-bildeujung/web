// 장바구니 담기를 세운다. 담기가 실제로 서버를 부르게 되면서(#316) 스텁이 없으면 거부되고,
// 그때 시트가 열린 채 남는 것은 **의도된 동작**이다 — 실패한 담기를 성공처럼 닫으면 안 된다.
import type { Page } from "@playwright/test";

/** 담기를 성공으로 세운다. 서버는 `201 Created`만 주고 본문이 없다 */
export async function stubAddToCart(page: Page) {
  await page.route("**/api/v1/carts/items", (route) => route.fulfill({ status: 201, body: "" }));
}
