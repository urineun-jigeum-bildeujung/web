// 고른 배송지 넘기기. 읽으면 지워지는지, 막힌 저장소에서 부르는 쪽이 알 수 있는지 본다.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { takePickedAddress, writePickedAddress } from "./picked-address";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("적은 배송지를 한 번만 읽는다", () => {
  expect(writePickedAddress(9)).toBe(true);

  expect(takePickedAddress()).toBe(9);
  // 남기면 다음에 연 결제 화면이 또 배송지를 바꾼다
  expect(takePickedAddress()).toBeNull();
});

test("적은 것이 없거나 이상한 값이면 없음이다", () => {
  expect(takePickedAddress()).toBeNull();

  sessionStorage.setItem("checkout.pickedAddress", "abc");
  expect(takePickedAddress()).toBeNull();
});

// 적지 못했는데 되돌아가면 고른 곳을 잃는다. 부르는 쪽이 새 결제 화면으로 바꿔 끼우게 알린다
test("저장소가 막혀 있으면 적지 못했다고 알리고 읽기는 없음이다", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });

  expect(writePickedAddress(9)).toBe(false);
  expect(takePickedAddress()).toBeNull();
});
