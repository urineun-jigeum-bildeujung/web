// 장바구니 선택 스토어 테스트. 키만 남기는지, 다시 열면 읽어 오는지, 깨진 값과 막힌 저장소를 견디는지 본다.
import { beforeEach, expect, test, vi } from "vitest";

import { useCartSelectionStore } from "./cart-selection-store";

const STORAGE_KEY = "gollaju.cartSelection";

beforeEach(() => {
  useCartSelectionStore.setState({ keys: [] });
  localStorage.clear();
});

// 탭을 닫았다 열어도 고른 것이 남아야 한다 (No.24, #563)
test("고른 줄의 키만 브라우저에 남기고, 새로 열면 그대로 읽어 온다", async () => {
  useCartSelectionStore.getState().setKeys(["NORMAL:1", "TIME_DEAL:3"]);

  // 이름·가격 같은 서버 값은 남기지 않는다(AGENTS 5.1)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
    state: { keys: ["NORMAL:1", "TIME_DEAL:3"] },
    version: 1,
  });

  // 새로 연 탭처럼 저장소에만 있는 목록을 읽어 온다
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { keys: ["NORMAL:2"] }, version: 1 }));
  await useCartSelectionStore.persist.rehydrate();

  expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:2"]);
});

// 손으로 고쳤거나 형식이 바뀐 값이 통째로 들어오면 고른 개수가 부푼다
test("저장된 값은 문자열 키만 한 번씩 옮긴다", async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      state: { keys: ["NORMAL:1", 1, null, "NORMAL:1", "TIME_DEAL:3"] },
      version: 1,
    }),
  );
  await useCartSelectionStore.persist.rehydrate();
  expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:1", "TIME_DEAL:3"]);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { keys: "NORMAL:1" }, version: 1 }));
  await useCartSelectionStore.persist.rehydrate();
  expect(useCartSelectionStore.getState().keys).toEqual([]);
});

test("저장소가 가득 차 쓰지 못해도 예외 없이 화면 안에서는 고른다", () => {
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("가득 참", "QuotaExceededError");
  });

  expect(() => useCartSelectionStore.getState().setKeys(["NORMAL:1"])).not.toThrow();
  expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:1"]);
  setItem.mockRestore();
});

test("저장소에 접근조차 막힌 브라우저에서도 읽기·고르기가 멈추지 않는다", async () => {
  // 사이트 데이터 저장을 막으면 localStorage를 읽기만 해도 SecurityError가 난다
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: () => {
      throw new DOMException("막힘", "SecurityError");
    },
  });
  try {
    await expect(useCartSelectionStore.persist.rehydrate()).resolves.toBeUndefined();
    expect(() => useCartSelectionStore.getState().setKeys(["NORMAL:2"])).not.toThrow();
    expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:2"]);
  } finally {
    if (original) Object.defineProperty(window, "localStorage", original);
    else Reflect.deleteProperty(window, "localStorage");
  }
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
});
