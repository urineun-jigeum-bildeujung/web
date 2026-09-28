// 주문내역 탭에 세울 주문 가리기 테스트. 결제 대기·취소만 빼고 나머지는 모르는 값까지 남기는지 본다.
import { expect, test } from "vitest";

import type { OrderSummary } from "@/entities/order";

import { isHistoryOrder } from "./history-orders";

function withStatus(orderStatus: string): OrderSummary {
  return {
    orderId: 1,
    orderNumber: "ORD-1",
    orderedAt: "2026-09-15T03:00:00.000Z",
    orderStatus,
    totalAmount: 4000,
    items: [],
  };
}

// 결제 대기는 보이지 않고 취소는 둘째 탭으로 간다(2026-09-28 PD 답). 모르는 값은 남긴다 —
// 상태를 모른다고 주문을 감추면 산 것이 사라진다 (#284)
test.each([
  ["PENDING", false],
  ["CANCELLED", false],
  ["pending", false],
  ["PAID", true],
  ["PREPARING", true],
  ["SHIPPING", true],
  ["DELIVERED", true],
  ["CONFIRMED", true],
  ["REFUNDED", true],
  ["SOMETHING_NEW", true],
])("%s → %s", (status, expected) => {
  expect(isHistoryOrder(withStatus(status))).toBe(expected);
});
