// 결제일 묶음 테스트. 같은 날 주문이 한 머리 아래 모이는지, 순서를 바꾸지 않는지 본다.
import { expect, test } from "vitest";

import type { OrderSummary } from "@/entities/order";

import { groupByPaidDate } from "./group-by-paid-date";

function order(orderId: number, orderedAt: string): OrderSummary {
  return {
    orderId,
    orderNumber: `ORD-${orderId}`,
    orderedAt,
    orderStatus: "PAID",
    totalAmount: 1000,
    items: [],
  };
}

const ids = (groups: ReturnType<typeof groupByPaidDate>) =>
  groups.map((group) => group.orders.map((o) => o.orderId));

// PD 메모 — 최상위는 결제일, 그 다음은 결제 시간이다 (3326:33463)
test("같은 날 주문은 한 묶음이 된다", () => {
  const groups = groupByPaidDate([
    order(3, "2026-09-03T10:34:00+09:00"),
    order(2, "2026-09-03T08:00:00+09:00"),
    order(1, "2026-09-02T21:09:00+09:00"),
  ]);

  expect(groups.map((group) => group.day)).toEqual(["26.09.03", "26.09.02"]);
  expect(ids(groups)).toEqual([[3, 2], [1]]);
});

// UTC로는 전날이어도 한국에서 같은 날이면 한 묶음이다
test("날짜는 한국 기준으로 가른다", () => {
  const groups = groupByPaidDate([
    order(2, "2026-09-03T01:00:00+09:00"),
    order(1, "2026-09-02T15:30:00Z"),
  ]);

  expect(ids(groups)).toEqual([[2, 1]]);
});

// 서버가 준 순서를 바꾸지 않는다. 떨어진 같은 날까지 모으면 최신순이 깨진다
test("붙어 있는 같은 날만 묶는다", () => {
  const groups = groupByPaidDate([
    order(3, "2026-09-03T10:00:00+09:00"),
    order(2, "2026-09-02T10:00:00+09:00"),
    order(1, "2026-09-03T09:00:00+09:00"),
  ]);

  expect(ids(groups)).toEqual([[3], [2], [1]]);
});

// 날짜를 지어내느니 머리를 비운다. 읽을 수 없는 주문끼리도 묶지 않는다
test("읽을 수 없는 시각이면 그 주문만 머리 없이 따로 둔다", () => {
  const groups = groupByPaidDate([order(2, "어제"), order(1, "모름")]);

  expect(groups.map((group) => group.day)).toEqual([null, null]);
  expect(ids(groups)).toEqual([[2], [1]]);
  expect(new Set(groups.map((group) => group.key)).size).toBe(2);
});
