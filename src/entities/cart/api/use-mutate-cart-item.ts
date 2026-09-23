// 장바구니 줄을 바꾸는 훅. 수량 변경과 빼기가 같은 캐시를 건드려 한 자리에 둔다.
//
// **실패 알림은 여기서 하지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경 실패를
// 토스트로 알리고 있어, 여기서 또 띄우면 같은 실패가 두 번 뜬다. 이 훅은 되돌리기만 맡는다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import {
  addCartItem,
  cartItemKey,
  changeCartItemQuantity,
  removeCartItem,
  type Cart,
  type CartItem,
  type CartItemRef,
} from "./cart";

/** 낙관적 갱신을 되돌릴 때 쓰는 직전 캐시 */
type Rollback = { previous: Cart | undefined };

/**
 * 수량을 바꾼 줄. **합계(`subtotal`)도 같이 바꾼다.**
 *
 * 수량만 먼저 그리면 다시 받기 전까지 그 줄의 합계가 옛 값이라, 결제 화면처럼 합계를 더해 금액을
 * 세는 곳이 수량과 다른 금액을 보인다 (#427). 합계는 장바구니 화면이 세는 방식과 같이
 * `price × quantity`다. 살 수 없는 줄은 값이 `null`이라 그대로 둔다.
 */
function withQuantity(row: CartItem, quantity: number): CartItem {
  return {
    ...row,
    quantity,
    subtotal: row.price === null ? row.subtotal : row.price * quantity,
  };
}

/**
 * 수량을 바꾸거나 줄을 뺀다.
 *
 * **서버 응답을 기다리지 않고 먼저 그린다.** 스테퍼는 연달아 누르는 조작이라 한 번에 한 왕복을
 * 기다리면 숫자가 늦게 따라와 화면이 끊긴다. 수량 변경이 절대값이 아니라 증감(`delta`)이라
 * 요청이 여러 번 나가도 서버에서 합쳐져, 늦게 도착한 것이 앞의 것을 덮어쓰지 않는다.
 */
export function useMutateCartItem() {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.cart.list();

  /** 먼저 그리고 직전 캐시를 돌려준다. 실패하면 그것으로 되돌린다 */
  async function applyNow(update: (cart: Cart) => Cart): Promise<Rollback> {
    // 진행 중인 조회를 세운다. 그대로 두면 나중에 끝나면서 방금 그린 것을 덮어쓴다
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<Cart>(queryKey);
    if (previous) {
      queryClient.setQueryData<Cart>(queryKey, update(previous));
    }
    return { previous };
  }

  function rollback(context: Rollback | undefined) {
    if (context?.previous) {
      queryClient.setQueryData<Cart>(queryKey, context.previous);
    }
  }

  /**
   * 성공이든 실패든 서버가 가진 것으로 맞춘다. 재고 제한처럼 서버가 다르게 정할 수 있다.
   *
   * **장바구니를 바꾸는 요청이 아직 날아가는 중이면 다시 받지 않는다.** 앞 요청의 재조회가 뒤
   * 요청을 서버가 받기 전 값을 가져와, 먼저 그려 둔 숫자를 한 칸 되돌렸다가 다시 올렸다(3 → 2 → 3).
   * 마지막 요청이 끝날 때 한 번만 맞춘다. 자기 자신은 이 시점에 아직 진행 중이라 1이다 —
   * 찜 훅(`use-mutate-wishlist`)과 같은 방식이다 (#427)
   */
  const settle = () => {
    if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
      return queryClient.invalidateQueries({ queryKey });
    }
  };

  const quantity = useMutation({
    mutationKey: queryKey,
    mutationFn: ({ item, delta }: { item: CartItemRef; delta: number }) =>
      changeCartItemQuantity(item, delta),
    onMutate: ({ item, delta }) =>
      applyNow((cart) => ({
        ...cart,
        items: cart.items.map((row) =>
          cartItemKey(row) === cartItemKey(item) ? withQuantity(row, row.quantity + delta) : row,
        ),
      })),
    onError: (_error, _variables, context) => rollback(context),
    onSettled: settle,
  });

  const removal = useMutation({
    mutationKey: queryKey,
    mutationFn: (item: CartItemRef) => removeCartItem(item),
    onMutate: (item) =>
      applyNow((cart) => ({
        ...cart,
        items: cart.items.filter((row) => cartItemKey(row) !== cartItemKey(item)),
      })),
    onError: (_error, _variables, context) => rollback(context),
    onSettled: settle,
  });

  /**
   * 담기.
   *
   * **낙관적 갱신을 걸지 않는다.** 수량 변경·빼기와 달리 담기는 서버가 줄을 만들어야 짝이
   * 확정된다. 먼저 그렸다가 되돌리면 방금 담은 것이 사라지는 장면이 되고, 그 사이 수량을
   * 만지면 없는 줄을 고치려 든다. 대신 부르는 쪽이 `isAdding`으로 대기를 보인다 (#316).
   */
  const addition = useMutation({
    mutationKey: queryKey,
    mutationFn: ({ item, quantity: count }: { item: CartItemRef; quantity: number }) =>
      addCartItem(item, count),
    onSettled: settle,
  });

  return {
    /** 증감을 보낸다. 스테퍼가 준 값과 이전 값의 차는 부르는 쪽이 계산한다 */
    changeQuantity: (item: CartItemRef, delta: number) => quantity.mutate({ item, delta }),
    remove: (item: CartItemRef) => removal.mutate(item),
    /**
     * 빼고 나서 기다린다.
     *
     * `remove`와 달리 실패를 던진다. **서버에서 빠진 것을 확인한 뒤에 화면 상태를 바꿔야
     * 하는 자리**가 쓴다 — 타임딜 목록의 담김 표시가 그렇다. 먼저 바꾸면 버튼은 "담기"로
     * 돌아가는데 장바구니에는 줄이 남고, 다시 담으면 서버가 수량을 더한다 (#316 리뷰).
     */
    removeAsync: (item: CartItemRef) => removal.mutateAsync(item),
    /** 담고 나서 기다린다. 실패는 던져서 부르는 쪽이 시트를 열어 둘 수 있게 한다 */
    add: (item: CartItemRef, count: number) => addition.mutateAsync({ item, quantity: count }),
    isAdding: addition.isPending,
  };
}
