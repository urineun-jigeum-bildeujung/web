// 담은 가짓수를 세는지, 꺼 두면 장바구니를 부르지 않는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getCart = vi.fn();
vi.mock("./cart", () => ({ getCart: () => getCart() }));

import { useQueryCartCount } from "./use-query-cart-count";

afterEach(() => getCart.mockReset());

// 헤더는 로그인하지 않은 메인에도 있어 세션으로 끈다. 부르면 401만 쌓인다
test("꺼 두면 장바구니를 부르지 않고 0이다", () => {
  const { result } = renderHook(() => useQueryCartCount({ enabled: false }), {
    wrapper: createQueryWrapper(),
  });

  expect(result.current).toBe(0);
  expect(getCart).not.toHaveBeenCalled();
});

// 재발급 실패로 세션이 끊겨도 캐시는 남는다. 그때 옛 뱃지를 보이면 안 된다
test("껐다가는 받아 둔 수도 내주지 않는다", async () => {
  getCart.mockResolvedValue({ memberId: 1, totalAmount: 0, items: [{ quantity: 1 }] });
  const { result, rerender } = renderHook(({ enabled }) => useQueryCartCount({ enabled }), {
    wrapper: createQueryWrapper(),
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current).toBe(1));

  rerender({ enabled: false });

  expect(result.current).toBe(0);
});

test("같은 상품을 여러 개 담아도 한 줄로 센다", async () => {
  getCart.mockResolvedValue({
    memberId: 1,
    totalAmount: 0,
    items: [{ quantity: 3 }, { quantity: 1 }],
  });

  const { result } = renderHook(() => useQueryCartCount(), { wrapper: createQueryWrapper() });

  await waitFor(() => expect(result.current).toBe(2));
});
