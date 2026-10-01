// 반품 접수: 주문 상세에서 시작해 세 단계(상품 고르기 → 사유 → 수거)를 거쳐 접수까지 끝까지 도는지 본다.
//
// **이 경로는 브라우저로 볼 길이 지금 없다.** 반품·교환은 배송완료 주문에만 열리는데,
// 백엔드가 `SHIPPING`·`DELIVERED` 자동 전이를 후순위로 미뤄(2026-09-21 회신) 그 상태를
// 만들 방법이 없다. 시연에서도 못 보여준다 — 여기가 유일하게 눈으로 확인하는 자리다 (#377).
//
// 무엇을 그리는지는 단위 테스트(`order-detail-view.test.tsx`·`order-claim-view.test.tsx`)가 본다.
// 여기서는 화면과 단계 사이를 실제로 건너가는지, 기기 뒤로가기로 돌아와도 적은 것이 남는지 본다.
// 사진 올리기는 S3로 가는 다른 출처 요청이라 여기서 다루지 않고 단위 테스트가 본다 (#408).

import { expect, test } from "@playwright/test";

import { daysAgo, stubOrders } from "./fixtures/orders";
import { signIn } from "./fixtures/session";

// 마이페이지는 세션이 없으면 로그인으로 보낸다(#447)
test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("주문 상세에서 반품을 세 단계로 접수하면 취소·반품·교환 탭으로 가고, 뒤로가면 주문 상세다", async ({
  page,
}) => {
  const claims: unknown[] = [];
  await stubOrders(page, { claims });

  await page.goto("/mypage/orders/1");

  // "반품·교환"을 누르면 시트에서 반품을 고른다(#462). 고른다고 접수되지 않고 신청 화면으로 간다
  await page.getByRole("button", { name: "반품·교환", exact: true }).click();
  await page.getByRole("link", { name: "반품하기" }).click();

  // ① 상품 고르기. 시안의 머리말은 "주문 내역"이다
  await expect(page).toHaveURL(/\/mypage\/orders\/1\/claim\?type=return/);
  await expect(page.getByRole("heading", { name: "주문 내역" })).toBeVisible();
  const toReason = page.getByRole("button", { name: "반품 신청하기" });
  await expect(toReason).toBeDisabled();
  await page.getByRole("checkbox", { name: /테스트 사료/ }).check();
  await toReason.click();

  // ② 사유. 사유 보기는 필수, 상세 사유는 선택이다
  await expect(page).toHaveURL(/step=reason/);
  await page.getByRole("button", { name: "테스트 사료 반품 수량 하나 늘리기" }).click();
  await page.getByRole("radio", { name: "상품 파손 · 불량" }).check();
  await page.getByRole("textbox", { name: "상세 사유" }).fill("포장이 찢어져 왔어요");
  await page.getByRole("button", { name: "다음" }).click();

  // ③ 수거. 기기 뒤로가기로 ②에 돌아가도 적어 둔 것이 남아야 한다
  await expect(page).toHaveURL(/step=pickup/);
  await page.goBack();
  await expect(page.getByRole("textbox", { name: "상세 사유" })).toHaveValue(
    "포장이 찢어져 왔어요",
  );
  await page.getByRole("button", { name: "다음" }).click();

  const submit = page.getByRole("button", { name: "반품 신청 완료하기" });
  await expect(submit).toBeDisabled();
  // 보기는 내일·모레라 날마다 글자가 바뀌어 순서로 고른다. 라디오는 화면에서 숨기고(sr-only)
  // 레이블을 누르게 만든 칸이라 좌표로 누르면 빗나간다(`check({ force: true })`로 확인).
  // 키보드 사용자처럼 초점을 두고 Space로 고른다 (#409 리뷰)
  const firstDate = page
    .getByRole("radiogroup", { name: "수거 희망일" })
    .getByRole("radio")
    .first();
  await firstDate.focus();
  await firstDate.press("Space");
  await expect(firstDate).toBeChecked();
  await submit.click();

  // 접수하면 신청이 보이는 취소·반품·교환 탭으로 간다(QA No.337)
  await expect(page).toHaveURL(/\/mypage\/orders\?tab=claims$/);
  expect(claims).toHaveLength(1);
  // 뒤로가기는 방금 접수한 작성 화면이 아니라 신청에 들어오기 전 주문 상세다
  await page.goBack();
  await expect(page).toHaveURL(/\/mypage\/orders\/1$/);
  const [claim] = claims as {
    claimType: string;
    reasonCode: string;
    reason: string;
    items: unknown[];
  }[];
  expect(claim.claimType).toBe("RETURN");
  expect(claim.items).toEqual([{ orderItemId: 10, quantity: 2 }]);
  // 고른 사유는 코드로 간다. 서버가 필수로 받아 빠지면 400이다 (#417)
  expect(claim.reasonCode).toBe("DAMAGED");
  // 서버에 필드가 없는 상세 사유·수거 희망일은 사유 글에 묶여 나간다
  expect(claim.reason).toContain("[상세 사유] 포장이 찢어져 왔어요");
  expect(claim.reason).toMatch(/\[수거 희망일\] \d{4}-\d{2}-\d{2}/);
  // 사진을 붙이지 않았으면 필드째 뺀다
  expect(claim).not.toHaveProperty("imageUrls");
});

// ③에서 새로고침하면 그 칸만 ①로 바뀌고 앞의 ①·② 칸이 남는다. 단계 순번만큼 되감으면 그 칸이
// 남아 내역에서 뒤로가기를 누를 때 옛 작성 화면이 열렸다(#650 리뷰)
test("③에서 새로고침한 뒤 다시 접수해도 뒤로가기가 작성 화면으로 돌아가지 않는다", async ({
  page,
}) => {
  await stubOrders(page, { claims: [] });
  await page.goto("/mypage/orders/1");
  await page.getByRole("button", { name: "반품·교환", exact: true }).click();
  await page.getByRole("link", { name: "반품하기" }).click();

  async function fillUntilPickup() {
    await page.getByRole("checkbox", { name: /테스트 사료/ }).check();
    await page.getByRole("button", { name: "반품 신청하기" }).click();
    await page.getByRole("radio", { name: "상품 파손 · 불량" }).check();
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(/step=pickup/);
  }

  await fillUntilPickup();
  // 적은 값이 사라져 ①로 당겨진다
  await page.reload();
  await expect(page).not.toHaveURL(/step=pickup/);
  await fillUntilPickup();

  const firstDate = page
    .getByRole("radiogroup", { name: "수거 희망일" })
    .getByRole("radio")
    .first();
  await firstDate.focus();
  await firstDate.press("Space");
  await page.getByRole("button", { name: "반품 신청 완료하기" }).click();

  await expect(page).toHaveURL(/\/mypage\/orders\?tab=claims$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/mypage\/orders\/1$/);
});

// 서버 `Order.isClaimable`이 배송완료 뒤 7일까지만 받는다. 화면이 안 막으면 사유까지 다 적고
// 나서 거절당한다 (#374)
test("배송완료 7일이 지나면 반품·교환 버튼이 없다", async ({ page }) => {
  await stubOrders(page, { detail: { deliveredAt: daysAgo(8) } });

  await page.goto("/mypage/orders/1");

  await expect(page.getByRole("heading", { name: "주문 상품 1개" })).toBeVisible();
  await expect(page.getByRole("button", { name: "반품·교환", exact: true })).toHaveCount(0);
  // 구매 확정은 기간이 없어 혼자 남는다 (#462)
  await expect(page.getByRole("button", { name: "구매확정", exact: true })).toBeVisible();
});
