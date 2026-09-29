// "바로 구매"가 결제 화면에 넘기는 값. 장바구니를 거치지 않고 한 상품을 고른 수량만큼 산다 (#520).
//
// 상품 상세가 만들고(`/payment?buy=NORMAL:252:2`) 결제 화면이 읽는다. 둘 다 views라 서로
// 가져다 쓸 수 없어 여기 둔다. **장바구니 줄과 같은 식별자(종류+번호)를 쓴다** — 결제 화면이
// 장바구니에서 고른 줄(`?items=NORMAL:252`)과 같은 규칙으로 주문 규격을 만든다.
//
// 서버의 주문 생성(`POST /orders`)은 장바구니를 보지 않고 `productId`/`dealItemId`와 수량을
// 그대로 받는다(백엔드 `CreateOrderRequest`). 그래서 장바구니에 담지 않고도 주문할 수 있다.

import type { CartItemRef, CartItemType } from "../api/cart";

/** 바로 구매를 싣는 쿼리 이름 */
export const BUY_NOW_PARAM = "buy";

export type BuyNow = CartItemRef & { quantity: number };

const ITEM_TYPES: readonly CartItemType[] = ["NORMAL", "TIME_DEAL"];

/** 결제 화면으로 가는 주소 */
export function toBuyNowPath({ itemType, itemId, quantity }: BuyNow): string {
  const query = new URLSearchParams({ [BUY_NOW_PARAM]: `${itemType}:${itemId}:${quantity}` });
  return `/payment?${query}`;
}

/**
 * 주소의 값을 읽는다. **맞지 않으면 없는 것으로 본다** — 주소창으로 고쳐 들어온 값이 그대로
 * 주문 본문에 실리면 서버가 400으로 거절하고, 사용자는 무엇이 틀렸는지 알 수 없다.
 */
export function parseBuyNow(value: string | null): BuyNow | null {
  if (!value) return null;

  const parts = value.split(":");
  // 칸이 더 붙은 값(`NORMAL:252:2:x`)도 앞 셋만 읽으면 통과한다. 정확히 셋이어야 한다 (#521 리뷰)
  if (parts.length !== 3) return null;
  const [itemType, rawId, rawQuantity] = parts;
  const itemId = Number(rawId);
  const quantity = Number(rawQuantity);
  const known = ITEM_TYPES.find((type) => type === itemType);
  if (!known || !Number.isSafeInteger(itemId) || itemId <= 0) return null;
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return null;

  return { itemType: known, itemId, quantity };
}
