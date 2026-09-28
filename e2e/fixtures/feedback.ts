// 반응 남기기를 세운다. 남길 수 있는 구매 목록과 등록을 한 상태로 묶어, 답한 항목은 실제 서버처럼
// 목록에서 빠진다 (#494).
//
// **로그인이 있어야 하는 요청이다.** 무엇을 보내는지 모양은 단위 테스트(`entities/review/api`)가 본다.

import type { Page } from "@playwright/test";

/**
 * 백엔드 `FeedbackCheckPendingListResponse.Item` 그대로. 첫째는 아이가 필수가 되기 전(2026-09-23) 주문이라
 * `petId`가 없고, 둘째는 그 뒤 주문이라 보리(7)에게 사 준 것이다
 */
const ITEMS = [
  {
    orderProductId: 11,
    productId: 1,
    productName: "치석 케어 덴탈껌 7개입",
    thumbnailUrl: null,
    checkAvailableAt: "2026-09-21T00:00:00Z",
    petId: null,
  },
  {
    orderProductId: 12,
    productId: 2,
    productName: "관절 튼튼 트릿 200g",
    thumbnailUrl: null,
    checkAvailableAt: "2026-09-22T00:00:00Z",
    petId: 7,
  },
];

export async function stubFeedbacks(page: Page) {
  const pending = [...ITEMS];
  /** 등록으로 나간 요청 본문. 무엇을 보냈는지 보는 테스트가 쓴다 */
  const sent: unknown[] = [];
  /** 목록을 부른 횟수. 로그아웃한 메인이 부르지 않는지 보는 테스트가 쓴다 */
  let listed = 0;

  await page.route("**/api/v1/reviews/feedbacks/pending", (route) => {
    listed += 1;
    return route.fulfill({ json: { content: pending } });
  });
  await page.route("**/api/v1/reviews/products/*/feedbacks", (route) => {
    const body = route.request().postDataJSON() as { orderProductId: number };
    sent.push(body);
    const index = pending.findIndex((item) => item.orderProductId === body.orderProductId);
    if (index >= 0) pending.splice(index, 1);
    return route.fulfill({ status: 201, body: "" });
  });

  return { sent, listed: () => listed };
}
