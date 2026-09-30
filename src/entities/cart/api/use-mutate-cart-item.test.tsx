// useMutateCartItem 훅 테스트. 먼저 그리는 수량·합계와, 요청이 겹칠 때 언제 다시 받는지,
// 방금 담은 것을 되돌릴 때 무엇을 보내는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

const { addCartItem, changeCartItemQuantity, removeCartItem } = vi.hoisted(() => ({
  addCartItem: vi.fn(),
  changeCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
}));

// 줄 키(`cartItemKey`)는 진짜를 쓴다. 서버로 가는 것만 갈아끼운다
vi.mock("./cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./cart")>()),
  addCartItem,
  changeCartItemQuantity,
  removeCartItem,
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
  addedAt: "2026-09-29T01:00:00Z",
};

/** 한 줄이 든 장바구니를 받아 둔 상태. `received: false`면 장바구니를 아직 받지 못한 상태다 */
function setup({ received = true }: { received?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  if (received) {
    client.setQueryData<Cart>(QUERY_KEYS.cart.list(), {
      memberId: 1,
      items: [ROW],
      totalAmount: 10000,
    });
  }
  const invalidate = vi.spyOn(client, "invalidateQueries");

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMutateCartItem(), { wrapper });

  const row = () => client.getQueryData<Cart>(QUERY_KEYS.cart.list())?.items[0];
  /** 담기가 끝나며 다시 받은 장바구니. 테스트에는 조회 함수가 없어 서버가 준 수량을 직접 넣는다 */
  const receive = (quantity: number) =>
    client.setQueryData<Cart>(QUERY_KEYS.cart.list(), {
      memberId: 1,
      items: [{ ...ROW, quantity, subtotal: 10000 * quantity }],
      totalAmount: 10000 * quantity,
    });
  return { result, row, invalidate, receive };
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

/**
 * 상품 상세의 "담기 취소" (#562). **이번에 담은 것만** 되돌린다 — 담기 전으로 돌려놓는다.
 * 줄을 통째로 빼면 전부터 담아 둔 것까지 사라지고, 담은 수만큼 빼면 서버가 자른 경우 너무 많이 뺀다.
 */
describe("담은 것 되돌리기", () => {
  test("담기 전에 없던 줄이면 줄을 뺀다", async () => {
    addCartItem.mockResolvedValue(undefined);
    removeCartItem.mockResolvedValue(undefined);
    const { result } = setup();
    const added = { itemType: "NORMAL", itemId: 2 } as const;

    let undo: (() => void) | undefined;
    await act(async () => {
      undo = await result.current.add(added, 2);
    });
    act(() => undo?.());

    await waitFor(() => expect(removeCartItem).toHaveBeenCalledWith(added));
    expect(changeCartItemQuantity).not.toHaveBeenCalled();
  });

  test("담기 전에 있던 줄이면 늘어난 만큼만 빼 담기 전 수량으로 돌려놓는다", async () => {
    addCartItem.mockResolvedValue(undefined);
    changeCartItemQuantity.mockResolvedValue(undefined);
    const { result, receive, row } = setup();

    let undo: (() => void) | undefined;
    await act(async () => {
      undo = await result.current.add(ROW, 3);
    });
    receive(4);
    act(() => undo?.());

    await waitFor(() => expect(changeCartItemQuantity).toHaveBeenCalledWith(ROW, -3));
    expect(removeCartItem).not.toHaveBeenCalled();
    // 먼저 그리는 수량도 담기 전 그대로다
    expect(row()?.quantity).toBe(1);
  });

  // 백엔드가 담기를 99에서 자른다(increase-quantity.lua). 담은 수만큼 빼면 담기 전보다 적게 남는다
  test("서버가 99개에서 잘랐으면 실제로 늘어난 만큼만 뺀다", async () => {
    addCartItem.mockResolvedValue(undefined);
    changeCartItemQuantity.mockResolvedValue(undefined);
    const { result, receive } = setup();

    let undo: (() => void) | undefined;
    await act(async () => {
      undo = await result.current.add(ROW, 99);
    });
    receive(99);
    act(() => undo?.());

    await waitFor(() => expect(changeCartItemQuantity).toHaveBeenCalledWith(ROW, -98));
  });

  test("담은 뒤 다시 받지 못해 수량이 그대로면 담은 수만큼 뺀다", async () => {
    addCartItem.mockResolvedValue(undefined);
    changeCartItemQuantity.mockResolvedValue(undefined);
    const { result } = setup();

    let undo: (() => void) | undefined;
    await act(async () => {
      undo = await result.current.add(ROW, 2);
    });
    act(() => undo?.());

    await waitFor(() => expect(changeCartItemQuantity).toHaveBeenCalledWith(ROW, -2));
  });

  // 기준 없이 되돌리면 전부터 담아 둔 줄을 지우거나 엉뚱한 수를 뺀다
  test("장바구니를 아직 받지 못해 담기 전 수량을 모르면 되돌리는 함수를 주지 않는다", async () => {
    addCartItem.mockResolvedValue(undefined);
    const { result } = setup({ received: false });

    let undo: (() => void) | undefined = () => {};
    await act(async () => {
      undo = await result.current.add(ROW, 1);
    });

    expect(undo).toBeUndefined();
  });
});
