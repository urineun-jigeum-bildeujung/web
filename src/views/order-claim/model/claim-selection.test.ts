// 선택 상태 계산 테스트. 서버 규칙(품목 단위 중복 금지·끝난 신청은 다시 받음)을 그대로 옮겼는지 본다.
import { expect, test } from "vitest";

import type { OrderDetailItem, OrderItemClaim } from "@/entities/order";

import {
  claimableItems,
  hasActiveClaim,
  isActiveClaim,
  toRequestItems,
  toggleSelection,
} from "./claim-selection";

function makeClaim(claimStatus: string): OrderItemClaim {
  return {
    claimId: 1,
    claimType: "RETURN",
    claimStatus,
    requestedAt: "2026-09-21T09:00:00Z",
    completedAt: claimStatus === "COMPLETED" ? "2026-09-22T09:00:00Z" : null,
  };
}

function makeItem(orderItemId: number, claims: OrderItemClaim[] = []): OrderDetailItem {
  return {
    orderItemId,
    thumbnailUrl: null,
    productName: `상품 ${orderItemId}`,
    quantity: 1,
    unitPrice: 1000,
    itemStatus: "PAID",
    claims,
  };
}

// 백엔드 `ClaimStatus.terminalStates()`가 COMPLETED·REJECTED 둘을 끝으로 본다
test.each([
  ["REQUESTED", true],
  ["COLLECTING", true],
  ["INSPECTING", true],
  ["COMPLETED", false],
  ["REJECTED", false],
])("%s는 진행 중이 %s다", (status, active) => {
  expect(isActiveClaim(makeClaim(status))).toBe(active);
});

test("끝난 신청만 있는 상품은 다시 신청할 수 있다", () => {
  expect(hasActiveClaim(makeItem(1, [makeClaim("COMPLETED"), makeClaim("REJECTED")]))).toBe(false);
  expect(hasActiveClaim(makeItem(1, [makeClaim("COMPLETED"), makeClaim("INSPECTING")]))).toBe(true);
});

test("진행 중인 신청이 걸린 상품은 목록에서 빠진다", () => {
  const items = [makeItem(1), makeItem(2, [makeClaim("REQUESTED")]), makeItem(3)];
  expect(claimableItems(items).map((item) => item.orderItemId)).toEqual([1, 3]);
});

test("켤 때 수량은 1로 시작하고 다시 누르면 목록에서 빠진다", () => {
  const picked = toggleSelection({}, 11);
  expect(picked).toEqual({ 11: 1 });
  expect(toggleSelection(picked, 11)).toEqual({});
});

// 수량을 0으로 만들 수 있으면 서버 `@Positive`에 걸린다. 스테퍼 하한이 1이라 0이 들어올 길이 없다
test("고른 것만 요청 모양으로 옮긴다", () => {
  expect(toRequestItems({ 11: 2, 12: 1 })).toEqual([
    { orderItemId: 11, quantity: 2 },
    { orderItemId: 12, quantity: 1 },
  ]);
  expect(toRequestItems({})).toEqual([]);
});
