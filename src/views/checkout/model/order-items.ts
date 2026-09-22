// 장바구니에서 결제할 줄만 골라낸다.

import { cartItemKey, type CartItem } from "@/entities/cart";

import type { OrderItemRequest } from "../api/orders";

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
/**
 * 고른 장바구니 줄을 싣는 쿼리 이름.
 *
 * 값을 만드는 곳은 장바구니 화면이고(`/payment?items=NORMAL:1,…`), 읽는 곳이 여기다.
 * **결제창에서 실패로 돌아올 때도 이 값을 되돌려 실어야 한다** — 빠지면 고른 것이
 * 장바구니 전체로 넓어져 고르지 않은 상품까지 주문된다 (#364).
 */
export const ITEMS_PARAM = "items";

export function pickOrderItems(items: CartItem[] | undefined, selected: string | null): CartItem[] {
  const sellable = items?.filter((item) => item.available) ?? [];
  if (selected === null) {
    return sellable;
  }

  const keys = selected.split(",");
  return sellable.filter((item) => keys.includes(cartItemKey(item)));
}

/**
 * 장바구니 줄을 주문 생성 규격으로 옮긴다.
 *
 * **장바구니와 주문의 규격이 다르다.** 장바구니는 `itemType`+`itemId`로 줄을 가리키는데
 * 주문은 종류별로 필드를 나눠 받고, `@AssertTrue`로 **둘 중 하나만** 허용한다. 장바구니
 * 규격을 그대로 보내면 본문이 통째로 거절당한다 (#306).
 *
 * `api`가 아니라 여기 있는 이유는 순수 변환이기 때문이다. 화면 테스트가 `api/orders`를
 * 통째로 목으로 바꿔서, 저기 두면 변환까지 사라진다.
 */
export function toOrderItem(item: CartItem): OrderItemRequest {
  return item.itemType === "TIME_DEAL"
    ? { dealItemId: item.itemId, quantity: item.quantity }
    : { productId: item.itemId, quantity: item.quantity };
}
