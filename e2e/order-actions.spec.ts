// 주문 목록의 구매확정과 주문 상세의 주문취소. 눌러서 서버까지 가고 화면이 그 결과대로 바뀌는지 본다.
//
// **시연에서 실제로 누를 두 동작이다.** 그런데 그전에는 시트를 열어 폭만 재고 확인창이
// 뜨는지만 봤고, `POST /orders/{id}/confirm`·`/cancel`은 한 번도 나가지 않았다 (#379).
//
// 무엇을 그리는지는 단위 테스트(`orders-view.test.tsx`·`order-detail-view.test.tsx`)가 본다.

import { expect, test } from "@playwright/test";

import { stubOrders } from "./fixtures/orders";

test("구매 확정을 누르면 서버까지 가고 확정됐다고 알린다", async ({ page }) => {
  const calls: string[] = [];
  await stubOrders(page, { calls });

  await page.goto("/mypage/orders");

  // 되돌릴 수 없는 동작이라 무엇을 확정하는지 보여주는 시트를 한 번 거친다
  await page
    .getByRole("button", { name: /구매확정/ })
    .first()
    .click();
  await expect(page.getByText("무사히 잘 도착했나요?")).toBeVisible();

  await page.getByRole("button", { name: "확정하기" }).click();

  await expect(page.getByText("구매 확정 완료")).toBeVisible();
  expect(calls).toEqual(["orders/2/confirm"]);
});

// 확정 전에 마음이 바뀔 수 있다. 닫는 길이 없으면 시트에 갇힌다
test("나중에 할게요를 누르면 확정하지 않고 닫는다", async ({ page }) => {
  const calls: string[] = [];
  await stubOrders(page, { calls });

  await page.goto("/mypage/orders");
  await page
    .getByRole("button", { name: /구매확정/ })
    .first()
    .click();
  await page.getByRole("button", { name: "나중에 할게요" }).click();

  await expect(page.getByText("무사히 잘 도착했나요?")).toBeHidden();
  expect(calls).toEqual([]);
});

// 서버가 주문 전체만 취소해 PD가 취소를 목록에서 빼고 주문 상세 맨 아래로 옮겼다 (#410)
test("주문 상세에서 주문 취소를 누르면 서버까지 가고 취소됐다고 알린다", async ({ page }) => {
  const calls: string[] = [];
  // 취소는 배송이 시작되기 전 주문에만 선다
  await stubOrders(page, { calls, detail: { orderStatus: "PAID" } });

  await page.goto("/mypage/orders/1");

  await page.getByRole("button", { name: "주문 취소하기" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("주문을 취소할까요?")).toBeVisible();

  await dialog.getByRole("button", { name: "주문 취소하기" }).click();

  await expect(page.getByText("주문 취소 완료")).toBeVisible();
  expect(calls).toEqual(["orders/1/cancel"]);
});
