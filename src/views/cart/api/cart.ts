// 장바구니 API. 조회·수량 변경·빼기 세 가지를 부른다.
//
// **화면은 이 파일의 함수와 훅만 본다.** 응답 규격이 바뀌면 여기만 고치면 되도록
// 필드 이름을 화면 쪽으로 옮기지 않고 명세 그대로 둔다.
//
// 규격 출처는 2026-09-16 백엔드 `API 명세 초안`이고 네 줄 모두 "완료"다. 경로와 줄 식별자는
// 명세 표에 그대로 있어 확정이다 — 삭제도 수량 변경과 같은 자원 경로를 쓴다 (#217에서 확인).

import { apiRequest } from "@/shared/api/client";

/** 담긴 줄의 종류. 타임딜과 일반 상품이 한 장바구니에 섞인다 */
export type CartItemType = "TIME_DEAL" | "NORMAL";

/**
 * 장바구니에 담긴 상품 한 줄.
 *
 * **살 수 없는 줄은 내용이 통째로 비어 온다.** `available: false`면 이름·사진·금액이 전부
 * `null`이고 `unavailableReason`만 채워진다. 그래서 내용 필드가 전부 nullable이다.
 */
export type CartItem = {
  itemType: CartItemType;
  itemId: number;
  quantity: number;
  available: boolean;
  /** 못 사는 까닭. `DEAL_ENDED`처럼 코드로 온다 */
  unavailableReason: string | null;
  productName: string | null;
  thumbnailUrl: string | null;
  /** 실제로 낼 금액. 명세가 `17500.00`처럼 소수로 준다 */
  price: number | null;
  originalPrice: number | null;
  discountRate: number | null;
  subtotal: number | null;
  /** 타임딜이 끝나는 시각 */
  dealEndAt: string | null;
};

export type Cart = {
  memberId: number;
  items: CartItem[];
  totalAmount: number;
};

/** 줄을 가리키는 자리. 식별자가 둘이라 늘 짝으로 다닌다 */
export type CartItemRef = Pick<CartItem, "itemType" | "itemId">;

/** React key와 고른 목록에 쓰는 한 덩어리 키. 식별자가 둘인 것을 화면까지 끌고 가지 않는다 */
export function cartItemKey(item: CartItemRef): string {
  return `${item.itemType}:${item.itemId}`;
}

function itemPath({ itemType, itemId }: CartItemRef): string {
  return `/carts/items/${itemType}/${itemId}`;
}

/** 장바구니를 가져온다 */
export function getCart(): Promise<Cart> {
  return apiRequest<Cart>("/carts");
}

/**
 * 수량을 바꾼다.
 *
 * **바뀐 수량이 아니라 증감을 보낸다.** 스테퍼는 바뀐 값을 들고 있으므로 부르는 쪽이
 * 이전 값과의 차를 계산해야 한다. 증감이라 연달아 눌러 요청이 여러 번 나가도 서버에서 합쳐진다.
 *
 * **응답 본문을 기대하지 않는다.** 명세가 약속하는 것은 `200 OK`뿐이다. 한때 `cartItemId`·
 * `quantity`가 온다고 적어 뒀는데, 그것은 명세 행의 "작성되어 있던 내용" 토글에 접혀 있던
 * 개정 전 내용이었다 (#217). 바뀐 값은 다시 조회해서 맞춘다.
 */
export function changeCartItemQuantity(item: CartItemRef, delta: number): Promise<void> {
  return apiRequest<void>(itemPath(item), {
    method: "PATCH",
    body: { delta },
  });
}

/** 장바구니에서 뺀다 */
export function removeCartItem(item: CartItemRef): Promise<void> {
  return apiRequest<void>(itemPath(item), { method: "DELETE" });
}
