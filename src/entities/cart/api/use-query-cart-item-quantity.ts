// 한 줄이 장바구니에 몇 개 담겨 있는지. 상품 상세의 수량 시트가 이미 담긴 상품을 알릴 때 본다 (#562).
//
// **로그인 여부는 부르는 쪽이 `enabled`로 준다.** `useQueryCartCount`와 같은 이유다 — 여기서
// 세션을 읽으면 서버 페이지가 이 슬라이스의 공개 API를 들이면서 빌드가 깨진다 (#470).

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { cartItemKey, getCart, type CartItemRef } from "./cart";

type UseQueryCartItemQuantityOptions = {
  /** 거짓이면 부르지 않고 0이다. 로그인하지 않았으면 끈다 */
  enabled?: boolean;
};

/**
 * 그 줄의 수량. 담겨 있지 않으면 0이다.
 *
 * **종류까지 같아야 같은 줄이다.** 타임딜과 일반 상품이 id 공간을 따로 써서, 같은 번호라도
 * `itemType`이 다르면 다른 줄이다.
 */
export function useQueryCartItemQuantity(
  item: CartItemRef,
  { enabled = true }: UseQueryCartItemQuantityOptions = {},
): number {
  const query = useQuery({
    queryKey: QUERY_KEYS.cart.list(),
    queryFn: getCart,
    enabled,
    select: (cart) =>
      cart.items.find((row) => cartItemKey(row) === cartItemKey(item))?.quantity ?? 0,
  });
  // 꺼 두면 받아 둔 수도 내주지 않는다. 세션이 끊긴 뒤에 옛 수량이 남지 않게 한다(`useQueryCartCount`와 같다)
  return enabled ? (query.data ?? 0) : 0;
}
