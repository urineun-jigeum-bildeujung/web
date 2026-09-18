// 장바구니에서 결제할 줄만 골라낸다.

import { cartItemKey, type CartItem } from "@/entities/cart";

/**
 * 결제 대상 줄을 고른다.
 *
 * **살 수 없는 줄은 언제나 뺀다.** `available: false`면 이름·금액이 전부 `null`이라
 * 금액을 셀 수도, 주문에 실을 수도 없다.
 *
 * `selected`는 장바구니가 `?items=NORMAL:1,TIME_DEAL:3`으로 넘긴 값이다. **쿼리 자체가 없을
 * 때만** 살 수 있는 줄 전부를 본다 — 주소창으로 바로 들어와도 화면이 성립해야 한다.
 *
 * **`?items=`처럼 비어 있는 것은 전체가 아니라 빈 선택이다.** 둘을 같이 다루면 고른 것이
 * 없는데 장바구니가 통째로 결제된다 (#259 리뷰). 빈 목록이면 결제 버튼이 잠긴다.
 */
export function pickOrderItems(items: CartItem[] | undefined, selected: string | null): CartItem[] {
  const sellable = items?.filter((item) => item.available) ?? [];
  if (selected === null) {
    return sellable;
  }

  const keys = selected.split(",");
  return sellable.filter((item) => keys.includes(cartItemKey(item)));
}
