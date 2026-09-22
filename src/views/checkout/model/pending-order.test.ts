// 만들어 둔 주문을 탭 안에서 들고 있는 저장소 테스트.
//
// 결제창 리다이렉트를 건너 살아남는 것이 목적이라, **못 읽는 경우에 결제를 막지 않는 것**이
// 정상 동작보다 중요하다. 사생활 보호 모드처럼 저장소가 막힌 환경이 실제로 있다 (#367).

import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { clearPendingOrder, readPendingOrder, writePendingOrder } from "./pending-order";

const ORDER = { orderId: 77, signature: '{"addressId":5}' };

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("적어 둔 주문을 그대로 읽는다", () => {
  writePendingOrder(ORDER);

  expect(readPendingOrder()).toEqual(ORDER);
});

test("적어 둔 것이 없으면 없다고 한다", () => {
  expect(readPendingOrder()).toBeNull();
});

test("지우면 없어진다", () => {
  writePendingOrder(ORDER);
  clearPendingOrder();

  expect(readPendingOrder()).toBeNull();
});

// 손으로 고쳤거나 옛 모양이 남아 있을 수 있다. 그대로 믿으면 없는 주문으로 결제를 시도한다
test("모양이 맞지 않으면 없는 것으로 다룬다", () => {
  for (const broken of ['{"orderId":"77","signature":"x"}', '{"orderId":0}', "{}", "깨진 값"]) {
    sessionStorage.setItem("checkout.pendingOrder", broken);
    expect(readPendingOrder()).toBeNull();
  }
});

// 사생활 보호 모드나 저장소 차단 설정에서는 접근 자체가 던진다. 결제를 막을 이유가 없다
test("저장소가 막혀 있어도 던지지 않는다", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("blocked");
  });

  expect(() => writePendingOrder(ORDER)).not.toThrow();
  expect(readPendingOrder()).toBeNull();
  expect(() => clearPendingOrder()).not.toThrow();
});
