// useRemovePaidCartItems 훅 테스트. 결제한 줄을 빼고, 실패해도 던지지 않고, 장바구니 캐시를 맞추는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";

const { removeCartItem, reportError } = vi.hoisted(() => ({
  removeCartItem: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("@/entities/cart", () => ({ removeCartItem }));
vi.mock("@/shared/lib/report-error", () => ({ reportError }));

import { useRemovePaidCartItems } from "./use-remove-paid-cart-items";

const PAID = [
  { itemType: "NORMAL" as const, itemId: 1 },
  { itemType: "TIME_DEAL" as const, itemId: 3 },
];

function setup() {
  const client = new QueryClient();
  client.setQueryData(QUERY_KEYS.cart.list(), { items: [] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRemovePaidCartItems(), { wrapper });
  const invalidated = () => client.getQueryState(QUERY_KEYS.cart.list())?.isInvalidated;
  return { remove: result.current, invalidated };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("결제한 줄을 모두 빼고 장바구니를 다시 받게 한다", async () => {
  removeCartItem.mockResolvedValue(undefined);
  const { remove, invalidated } = setup();

  await remove(PAID);

  expect(removeCartItem).toHaveBeenCalledTimes(2);
  expect(removeCartItem).toHaveBeenCalledWith(PAID[0]);
  expect(removeCartItem).toHaveBeenCalledWith(PAID[1]);
  expect(invalidated()).toBe(true);
});

// 결제는 이미 끝났다. 빼기 실패로 던지면 완료 화면이 실패처럼 보인다 (#457)
test("한 줄이 실패해도 던지지 않고 나머지는 빼며 기록만 한다", async () => {
  removeCartItem.mockRejectedValueOnce(new Error("연결 실패")).mockResolvedValueOnce(undefined);
  const { remove, invalidated } = setup();

  await expect(remove(PAID)).resolves.toBeUndefined();

  expect(removeCartItem).toHaveBeenCalledTimes(2);
  expect(reportError).toHaveBeenCalledTimes(1);
  expect(reportError).toHaveBeenCalledWith("checkout.removePaidCartItems", expect.any(Error));
  expect(invalidated()).toBe(true);
});
