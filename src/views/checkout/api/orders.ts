// 결제 앞에 서는 주문 생성. 무엇을 어디로 보낼지 확정하고 주문 번호를 받는다.
//
// **결제 흐름의 첫 단계다.** 이 응답의 `orderId`(숫자 PK)를 `POST /payments`에 넘겨야
// 토스에 쓸 주문번호가 나온다. 순서를 건너뛰면 위젯은 떠도 승인에서 막힌다.
//
// **`Idempotency-Key`를 매번 새로 만든다.** 결제 버튼을 두 번 눌렀을 때 주문이 두 건
// 생기는 것을 서버가 막을 수 있게 하는 값이다. 프론트가 UUID를 만들 자리는
// 주문번호가 아니라 여기다.

import { apiRequest } from "@/shared/api/client";

const ORDERS_PATH = "/orders";

/**
 * 주문에 담는 줄.
 *
 * **장바구니와 규격이 다르다.** 장바구니는 `itemType`+`itemId`로 줄을 가리키는데
 * (`AddCartItemRequest`), 주문은 종류별로 필드를 나눠 받는다.
 *
 * ```java
 * public record Item(Long productId, Long dealItemId, @Positive int quantity) {
 *     @AssertTrue(message = "productId와 dealItemId 중 하나만 존재해야 합니다.")
 *     public boolean isValidReference() {
 *         return (productId == null) != (dealItemId == null);
 *     }
 * }
 * ```
 *
 * **둘 중 정확히 하나만 실어야 한다.** 둘 다 보내도, 둘 다 안 보내도 서버가 본문을 거절한다.
 * 그래서 타입도 유니온으로 갈라 두 필드를 동시에 채울 수 없게 한다 (#306).
 */
export type OrderItemRequest = { quantity: number } & (
  { productId: number; dealItemId?: never } | { dealItemId: number; productId?: never }
);

export type CreateOrderRequest = {
  addressId: number;
  items: OrderItemRequest[];
  /** 적지 않으면 빈 문자열이 아니라 보내지 않는다 */
  deliveryNote?: string | null;
};

/** 숫자 PK다. 토스에 쓰는 문자열 주문번호(`tossOrderId`)와 다른 값이다 */
export type CreateOrderResult = {
  orderId: number;
};

/**
 * 주문을 만들고 그 id를 돌려준다.
 *
 * **같은 주문을 두 번 만들지 않게 `Idempotency-Key`를 싣는다.** 사용자가 결제 버튼을
 * 연타하거나 네트워크가 끊겨 재시도가 일어나도 서버가 같은 요청으로 알아본다.
 */
export function createOrder(request: CreateOrderRequest): Promise<CreateOrderResult> {
  return apiRequest<CreateOrderResult>(ORDERS_PATH, {
    method: "POST",
    body: request,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}
