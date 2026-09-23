// 환불 예상 금액 테스트. 개당 금액과 수량으로 세고 반품비를 빼는지 본다.
import { expect, test } from "vitest";

import { estimateRefund, RETURN_FEE } from "./refund-estimate";

// 시안 mypa_361 — 43,900원 한 개면 반품비 3,000원을 빼 40,900원
test("시안의 예와 같은 값을 낸다", () => {
  expect(estimateRefund([{ unitPrice: 43900, quantity: 1 }])).toEqual({
    productAmount: 43900,
    shippingFee: 0,
    returnFee: RETURN_FEE,
    refundAmount: 40900,
  });
});

// 산 개수가 아니라 돌려보내는 개수로 센다
test("여러 상품은 개당 금액 × 반품 수량을 더한다", () => {
  const estimate = estimateRefund([
    { unitPrice: 20000, quantity: 2 },
    { unitPrice: 5000, quantity: 1 },
  ]);

  expect(estimate.productAmount).toBe(45000);
  expect(estimate.refundAmount).toBe(42000);
});

test("반품비보다 싸면 환불 예상은 0원이다", () => {
  expect(estimateRefund([{ unitPrice: 2000, quantity: 1 }]).refundAmount).toBe(0);
});
