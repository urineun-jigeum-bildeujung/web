// 만들어 둔 주문을 탭 안에서 들고 있는 저장소 테스트.
//
// 결제창 리다이렉트를 건너 살아남는 것이 목적이라, **못 읽는 경우에 결제를 막지 않는 것**이
// 정상 동작보다 중요하다. 사생활 보호 모드처럼 저장소가 막힌 환경이 실제로 있다 (#367).

import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  clearPendingOrder,
  newPendingOrder,
  readPendingOrder,
  writePendingOrder,
} from "./pending-order";

const ORDER = { signature: '{"addressId":5}', idempotencyKey: "key-1", orderId: 77 };

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

// 보내기 전에 적어 둔다. 응답을 잃은 뒤에도 키가 남아야 다음 누름이 같은 키로 묻는다 (#412)
test("주문을 받기 전에 적어 둔 키도 그대로 읽는다", () => {
  const before = { ...ORDER, orderId: null };
  writePendingOrder(before);

  expect(readPendingOrder()).toEqual(before);
});

// 본문이 바뀌면 새 키여야 한다. 서버는 같은 키에 본문을 견주지 않고 처음 주문을 돌려준다 (#412)
test("새로 시작할 때마다 다른 키를 만든다", () => {
  const first = newPendingOrder("a");
  const second = newPendingOrder("a");

  expect(first.orderId).toBeNull();
  expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
});

test("지우면 없어진다", () => {
  writePendingOrder(ORDER);
  clearPendingOrder();

  expect(readPendingOrder()).toBeNull();
});

// 손으로 고쳤거나 옛 모양이 남아 있을 수 있다. 그대로 믿으면 없는 주문으로 결제를 시도한다
test("모양이 맞지 않으면 없는 것으로 다룬다", () => {
  for (const broken of [
    '{"orderId":"77","signature":"x","idempotencyKey":"k"}',
    '{"orderId":0,"signature":"x","idempotencyKey":"k"}',
    '{"orderId":77,"signature":"x","idempotencyKey":""}',
    // 키를 들기 전(#412) 모양이다. 키 없이 다시 보내면 서버가 같은 요청으로 못 알아본다
    '{"orderId":77,"signature":"x"}',
    "{}",
    "깨진 값",
  ]) {
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
