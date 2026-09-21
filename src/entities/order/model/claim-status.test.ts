// 신청 상태 판정 테스트. 서버 enum(`ClaimType`·`ClaimStatus`)을 그대로 옮겼는지 본다.
import { expect, test } from "vitest";

import type { OrderDetailItem, OrderItemClaim } from "../api/orders";

import {
  claimLabel,
  claimableItems,
  currentClaim,
  hasActiveClaim,
  isActiveClaim,
} from "./claim-status";

function makeClaim(over: Partial<OrderItemClaim> = {}): OrderItemClaim {
  return {
    claimId: 1,
    claimType: "RETURN",
    claimStatus: "REQUESTED",
    requestedAt: "2026-09-21T09:00:00Z",
    completedAt: null,
    ...over,
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
])("%s는 진행 중이 %s다", (claimStatus, active) => {
  expect(isActiveClaim(makeClaim({ claimStatus }))).toBe(active);
});

test("끝난 신청만 있는 상품은 다시 신청할 수 있다", () => {
  expect(
    hasActiveClaim(
      makeItem(1, [
        makeClaim({ claimStatus: "COMPLETED" }),
        makeClaim({ claimStatus: "REJECTED" }),
      ]),
    ),
  ).toBe(false);
  expect(
    hasActiveClaim(
      makeItem(1, [
        makeClaim({ claimStatus: "COMPLETED" }),
        makeClaim({ claimStatus: "INSPECTING" }),
      ]),
    ),
  ).toBe(true);
});

test("진행 중인 신청이 걸린 상품은 목록에서 빠진다", () => {
  const items = [makeItem(1), makeItem(2, [makeClaim()]), makeItem(3)];
  expect(claimableItems(items).map((item) => item.orderItemId)).toEqual([1, 3]);
});

test("진행 중인 것이 있으면 그것을, 없으면 가장 최근에 끝난 것을 고른다", () => {
  const active = makeClaim({ claimId: 2, claimStatus: "COLLECTING" });
  const done = makeClaim({
    claimId: 1,
    claimStatus: "REJECTED",
    requestedAt: "2026-09-20T09:00:00Z",
  });

  expect(currentClaim(makeItem(1, [done, active]))?.claimId).toBe(2);
  // 거절된 것도 보여야 한다. 반품이 안 됐다는 사실을 주문 상세에서 알 수 있어야 한다
  expect(currentClaim(makeItem(1, [done]))?.claimId).toBe(1);
  expect(currentClaim(makeItem(1))).toBeUndefined();
});

test.each([
  ["RETURN", "REQUESTED", "반품 접수"],
  ["RETURN", "COLLECTING", "반품 수거 중"],
  ["EXCHANGE", "INSPECTING", "교환 확인 중"],
  ["EXCHANGE", "COMPLETED", "교환 완료"],
  ["CANCEL", "REJECTED", "취소 거절"],
])('%s·%s는 "%s"로 읽힌다', (claimType, claimStatus, label) => {
  expect(claimLabel(makeClaim({ claimType, claimStatus }))).toBe(label);
});

// 서버가 enum을 늘렸을 때 "undefined 접수"처럼 그리지 않는다
test("모르는 값이면 문구를 만들지 않는다", () => {
  expect(claimLabel(makeClaim({ claimType: "REFUND" }))).toBeNull();
  expect(claimLabel(makeClaim({ claimStatus: "ON_HOLD" }))).toBeNull();
});
