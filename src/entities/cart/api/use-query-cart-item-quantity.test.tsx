// 한 줄의 담긴 수량을 종류까지 맞춰 읽는지, 꺼 두면 장바구니를 부르지 않는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getCart = vi.fn();
// 줄 키(`cartItemKey`)는 진짜를 쓴다. 서버로 가는 것만 갈아끼운다
vi.mock("./cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./cart")>()),
  getCart: () => getCart(),
}));

import { useQueryCartItemQuantity } from "./use-query-cart-item-quantity";

afterEach(() => getCart.mockReset());

// 타임딜과 일반 상품은 id 공간이 따로다. 번호만 보면 남의 줄 수량을 읽는다
test("종류와 번호가 모두 같은 줄의 수량을 준다", async () => {
  getCart.mockResolvedValue({
    memberId: 1,
    totalAmount: 0,
    items: [
      { itemType: "NORMAL", itemId: 1, quantity: 3 },
      { itemType: "TIME_DEAL", itemId: 1, quantity: 5 },
    ],
  });

  const { result } = renderHook(
    () => useQueryCartItemQuantity({ itemType: "TIME_DEAL", itemId: 1 }),
    { wrapper: createQueryWrapper() },
  );

  await waitFor(() => expect(result.current).toBe(5));
});

test("담겨 있지 않으면 0이다", async () => {
  getCart.mockResolvedValue({
    memberId: 1,
    totalAmount: 0,
    items: [{ itemType: "NORMAL", itemId: 1, quantity: 3 }],
  });

  const { result } = renderHook(() => useQueryCartItemQuantity({ itemType: "NORMAL", itemId: 2 }), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(getCart).toHaveBeenCalled());
  expect(result.current).toBe(0);
});

// 로그인하지 않은 상세에서 부르면 401만 쌓인다
test("꺼 두면 장바구니를 부르지 않고 0이다", () => {
  const { result } = renderHook(
    () => useQueryCartItemQuantity({ itemType: "NORMAL", itemId: 1 }, { enabled: false }),
    { wrapper: createQueryWrapper() },
  );

  expect(result.current).toBe(0);
  expect(getCart).not.toHaveBeenCalled();
});
