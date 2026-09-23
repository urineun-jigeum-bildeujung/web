// 결제 앞에 서는 주문 생성. 무엇을 어디로 보낼지 확정하고 주문 번호를 받는다.
//
// **결제 흐름의 첫 단계다.** 이 응답의 `orderId`(숫자 PK)를 `POST /payments`에 넘겨야
// 토스에 쓸 주문번호가 나온다. 순서를 건너뛰면 위젯은 떠도 승인에서 막힌다.
//
// **`Idempotency-Key`는 부르는 쪽이 준다.** 서버는 같은 키로 온 요청에 처음 만든 주문을
// 돌려준다(`findExistingResult`). 응답을 잃고 다시 누를 때 같은 키를 실어야 주문이 두 건
// 생기지 않으므로, 결제 화면이 본문의 지문과 함께 탭에 들고 있다가 준다 (#412).

import { cancelOrder, getOrderDetail } from "@/entities/order";
import { apiRequest } from "@/shared/api/client";
import { reportError } from "@/shared/lib/report-error";

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
  /**
   * 어느 아이 몫으로 사는지. **서버가 필수로 받는다**(`@NotNull`) — 빠지면 본문 검증에서
   * 400이다. 서버는 이 값을 주문 줄마다 저장한다 (#393).
   */
  petId: number;
  items: OrderItemRequest[];
  /** 적지 않으면 빈 문자열이 아니라 보내지 않는다 */
  deliveryNote?: string | null;
};

/** 주문에 담긴 줄 하나. 응답이 확정한 이름과 낱개 값이다 */
export type CreatedOrderItem = {
  orderItemId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

/**
 * 주문 생성 응답.
 *
 * **`orderId`는 숫자 PK다.** 토스에 쓰는 문자열 주문번호(`tossOrderId`)와 다른 값이다.
 *
 * **`shippingFee`가 여기 있다.** 주문 상세 조회(`GET /orders/{orderId}`)에는 그 필드가 없어
 * 화면이 `totalAmount - productAmount`로 만들고 있는데(#288), 만드는 시점에는 서버가 직접
 * 준다. 로컬 백엔드로 실측해 확인했다 (#322).
 *
 * 지금 화면이 쓰는 것은 `orderId`뿐이다 — **결제 금액은 `[2] POST /payments`가 주는 값을
 * 쓴다**(#312). 나머지를 타입에 담는 것은 응답을 조용히 버리지 않기 위해서다.
 */
export type CreateOrderResult = {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  productAmount: number;
  shippingFee: number;
  totalAmount: number;
  items: CreatedOrderItem[];
};

/**
 * 주문을 만들고 그 id를 돌려준다.
 *
 * **같은 키로 다시 부르면 서버가 처음 만든 주문을 돌려준다.** 본문은 견주지 않는다 — 본문이
 * 바뀌었으면 부르는 쪽이 키도 바꿔야 한다 (#412).
 */
export function createOrder(
  request: CreateOrderRequest,
  idempotencyKey: string,
): Promise<CreateOrderResult> {
  return apiRequest<CreateOrderResult>(ORDERS_PATH, {
    method: "POST",
    body: request,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/**
 * 더 쓰지 않을 결제 대기 주문을 취소해 재고 예약을 푼다.
 *
 * 주문을 만들면 서버가 재고를 예약한다. 결제하지 않은 주문의 예약이 풀리는 길은 결제 실패
 * 알림과 취소뿐이다 — `reservationExpiresAt`은 기록만 되고 읽는 곳이 없다. 본문이 바뀌어 새
 * 주문을 만들 때 들고 있던 것을 그냥 두면 그 예약이 끝내 풀리지 않는다 (#412).
 *
 * **결제 대기일 때만 취소한다.** 서버는 결제된 주문도 취소를 받는다(`PAID → CANCELLED`).
 * 탭을 복제하면 `sessionStorage`도 복제되어, 다른 탭에서 이미 결제한 주문을 들고 있을 수 있다.
 *
 * **실패해도 던지지 않는다.** 이 누름의 목적은 새 주문으로 결제하는 것이다. 예약을 못 풀었다고
 * 결제까지 막으면 사용자가 얻는 것이 없다.
 */
export async function releaseOrder(orderId: number): Promise<void> {
  try {
    const order = await getOrderDetail(orderId);
    if (order.orderStatus === "PENDING") {
      await cancelOrder(orderId);
    }
  } catch (error) {
    reportError("checkout.releaseOrder", error);
  }
}
