// 반품 접수: 주문 상세에서 시작해 상품과 수량을 고르고 접수까지 끝까지 도는지 본다.
//
// **이 경로는 브라우저로 볼 길이 지금 없다.** 반품·교환은 배송완료 주문에만 열리는데,
// 백엔드가 `SHIPPING`·`DELIVERED` 자동 전이를 후순위로 미뤄(2026-09-21 회신) 그 상태를
// 만들 방법이 없다. 시연에서도 못 보여준다 — 여기가 유일하게 눈으로 확인하는 자리다 (#377).
//
// 무엇을 그리는지는 단위 테스트(`order-detail-view.test.tsx`·`order-claim-view.test.tsx`)가 본다.
// 여기서는 화면 사이를 실제로 건너가는지를 본다.

import { expect, test } from "@playwright/test";

import { daysAgo, stubOrders } from "./fixtures/orders";

test("주문 상세에서 반품을 접수하고 돌아온다", async ({ page }) => {
  const claims: unknown[] = [];
  await stubOrders(page, { claims });

  await page.goto("/mypage/orders/1");

  // 확인창을 한 번 거친다. 누르는 순간 접수되는 것처럼 보이면 안 된다.
  // 시안은 트리거와 확인을 같은 문구로 쓴다 — 트리거는 버튼, 확인은 링크다 (#405)
  await page.getByRole("button", { name: "반품 신청하기" }).click();
  await page.getByRole("link", { name: "반품 신청하기" }).click();

  await expect(page).toHaveURL(/\/mypage\/orders\/1\/claim\?type=return/);
  await expect(page.getByRole("heading", { name: "반품 신청" })).toBeVisible();

  // 고르기 전에는 신청할 수 없다
  const submit = page.getByRole("button", { name: /신청하기/ });
  await expect(submit).toBeDisabled();

  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "테스트 사료 신청 수량 하나 늘리기" }).click();
  await page.getByLabel(/사유/).fill("포장이 찢어져 왔어요");
  await expect(submit).toBeEnabled();

  await submit.click();

  // 접수하면 주문 상세로 돌아간다
  await expect(page).toHaveURL(/\/mypage\/orders\/1$/);
  expect(claims).toEqual([
    {
      claimType: "RETURN",
      reason: "포장이 찢어져 왔어요",
      items: [{ orderItemId: 10, quantity: 2 }],
    },
  ]);
});

// 서버 `Order.isClaimable`이 배송완료 뒤 7일까지만 받는다. 화면이 안 막으면 사유까지 다 적고
// 나서 거절당한다 (#374)
test("배송완료 7일이 지나면 반품·교환 버튼이 없다", async ({ page }) => {
  await stubOrders(page, { detail: { deliveredAt: daysAgo(8) } });

  await page.goto("/mypage/orders/1");

  await expect(page.getByRole("heading", { name: "주문 상품 1개" })).toBeVisible();
  await expect(page.getByRole("button", { name: "반품 신청하기" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "교환 신청하기" })).toHaveCount(0);
});
