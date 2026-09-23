// useMutateCartItem 훅 테스트. 먼저 그리는 수량·합계와, 요청이 겹칠 때 언제 다시 받는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const { changeCartItemQuantity } = vi.hoisted(() => ({ changeCartItemQuantity: vi.fn() }));

// 줄 키(`cartItemKey`)는 진짜를 쓴다. 서버로 가는 것만 갈아끼운다
vi.mock("./cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./cart")>()),
  changeCartItemQuantity,
}));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { Cart, CartItem } from "./cart";
import { useMutateCartItem } from "./use-mutate-cart-item";

const ROW: CartItem = {
  itemType: "NORMAL",
  itemId: 1,
  quantity: 1,
  available: true,
  unavailableReason: null,
  productName: "사료",
  thumbnailUrl: null,
  price: 10000,
  originalPrice: 10000,
  discountRate: 0,
  subtotal: 10000,
  dealEndAt: null,
};

/** 한 줄이 든 장바구니를 받아 둔 상태 */
function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData<Cart>(QUERY_KEYS.cart.list(), {
    memberId: 1,
    items: [ROW],
    totalAmount: 10000,
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMutateCartItem(), { wrapper });

  const row = () => client.getQueryData<Cart>(QUERY_KEYS.cart.list())?.items[0];
  return { result, row, invalidate };
}

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * **앞 요청의 재조회가 뒤 요청을 서버가 받기 전 값을 가져와 먼저 그린 숫자를 덮었다**(3 → 2 → 3).
 * 겹치면 마지막 요청이 끝날 때 한 번만 다시 받는다 (#427)
 */
test("수량 변경이 겹치면 마지막 것이 끝날 때만 다시 받는다", async () => {
  const finish: (() => void)[] = [];
  changeCartItemQuantity.mockImplementation(
    () => new Promise<void>((resolve) => finish.push(resolve)),
  );
  const { result, row, invalidate } = setup();

  act(() => result.current.changeQuantity(ROW, 1));
  await waitFor(() => expect(finish).toHaveLength(1));
  act(() => result.current.changeQuantity(ROW, 1));
  await waitFor(() => expect(finish).toHaveLength(2));
  expect(row()?.quantity).toBe(3);

  // 앞 요청이 끝나도 뒤 요청이 날아가는 중이라 다시 받지 않는다
  await act(async () => finish[0]());
  expect(invalidate).not.toHaveBeenCalled();
  expect(row()?.quantity).toBe(3);

  await act(async () => finish[1]());
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
});

// 합계를 옛 값으로 두면 결제 화면처럼 합계를 더해 금액을 세는 곳이 수량과 다른 금액을 보인다 (#427)
test("수량을 먼저 그릴 때 그 줄의 합계도 같이 바꾼다", async () => {
  changeCartItemQuantity.mockImplementation(() => new Promise<void>(() => {}));
  const { result, row } = setup();

  act(() => result.current.changeQuantity(ROW, 2));

  await waitFor(() => expect(row()?.quantity).toBe(3));
  expect(row()?.subtotal).toBe(30000);
});
