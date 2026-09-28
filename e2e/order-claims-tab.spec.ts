// 주문·배송 확인의 두 탭을 실제 브라우저로 본다. 취소한 주문은 첫 탭에 서지 않고 둘째 탭에
// "취소"로 서며, 반품 신청은 "환불"로 선다(#462). 전에는 스텁이 어떤 주문을 물어도 같은 상세를
// 돌려줘 둘째 탭이 건을 하나도 그리지 못했다(#474).
//
// 무엇을 어떻게 묶는지는 단위 테스트(`orders-view.test.tsx`·`claim-entries.test.ts`)가 본다.

import { expect, test } from "@playwright/test";

import { stubOrders } from "./fixtures/orders";
import { signIn } from "./fixtures/session";

// 마이페이지는 세션이 없으면 로그인으로 보낸다(#447)
test.beforeEach(async ({ page }) => {
  await signIn(page);
  await stubOrders(page);
});

test("취소한 주문은 주문내역 탭에 서지 않는다", async ({ page }) => {
  await page.goto("/mypage/orders");

  await expect(page.getByText("테스트 사료")).toBeVisible();
  await expect(page.getByText("테스트 덴탈껌")).toHaveCount(0);
});

test("취소·반품·교환 탭은 취소와 반품 신청을 건으로 세우고 각 주문 상세로 잇는다", async ({
  page,
}) => {
  await page.goto("/mypage/orders?tab=claims");

  // 건마다 뱃지와 상품이 링크 이름에 들어가 화면 낭독기로도 가를 수 있다(#474)
  const cancel = page.getByRole("link", { name: "취소 테스트 덴탈껌 자세히 보기" });
  const refund = page.getByRole("link", { name: "환불 테스트 간식 자세히 보기" });
  await expect(cancel).toHaveAttribute("href", "/mypage/orders/4");
  await expect(refund).toHaveAttribute("href", "/mypage/orders/2");

  // 신청이 없는 구매확정 주문은 건이 되지 않는다
  await expect(page.getByText("테스트 영양제")).toHaveCount(0);
  await expect(page.getByText("취소·반품·교환 내역이 없어요")).toHaveCount(0);
});
