// 주문 API. 지금은 목록 조회 하나를 부른다.
//
// **화면은 이 파일의 타입과 함수만 본다.** 응답 규격이 바뀌면 여기만 고치면 되도록
// 필드 이름을 화면 쪽으로 옮기지 않고 명세 그대로 둔다 (`entities/cart/api/cart.ts`와 같은 방식).
//
// 규격 출처는 2026-09-21에 백엔드 `API 명세`의 행을 열어 확인한 Example이다. 주문 섹션 10줄이
// 모두 "완료"이고 목록은 커서 페이지네이션이다.

import { apiRequest } from "@/shared/api/client";

const ORDERS_PATH = "/orders";

/**
 * 목록 한 줄에 담겨 오는 주문 상품.
 *
 * **상세보다 좁다.** 목록은 썸네일·이름·수량만 주고 금액·상태·클레임은 주문 상세
 * (`GET /orders/{orderId}`)에만 있다.
 */
export type OrderListItem = {
  orderItemId: number;
  /** 명세 Example은 늘 채워 주지만 이미지가 빠진 상품을 본 적이 있어 없을 때를 함께 다룬다 */
  thumbnailUrl: string | null;
  productName: string;
  quantity: number;
};

/** 목록 한 줄. 백엔드 응답 `orders[]`의 모양 그대로다 */
export type OrderSummary = {
  orderId: number;
  /** 사용자에게 보이는 주문번호(`ORD-…`). 문의할 때 대는 값이라 표시용이다 */
  orderNumber: string;
  /** ISO 8601. 화면 형식으로 바꾸는 것은 보여 주는 쪽이 한다 */
  orderedAt: string;
  /**
   * 서버가 주는 주문 상태.
   *
   * **문자열로 둔 것은 값을 다 알지 못해서다.** 명세에서 확인된 것은 `PAID`·`DELIVERED`와
   * 구매 확정이 만드는 `CONFIRMED` 셋뿐이고, 배송준비중·배송중·취소에 해당하는 값은
   * 어디에도 적혀 있지 않다. 좁은 유니온으로 막으면 모르는 값이 올 때 타입만 맞고 화면이
   * 조용히 비므로, 받을 때는 넓게 두고 `toOrderStatus`가 아는 것만 통과시킨다 (#284).
   */
  orderStatus: string;
  totalAmount: number;
  items: OrderListItem[];
};

/**
 * 목록 응답.
 *
 * **커서 페이지네이션이다.** `nextCursor`를 다음 요청의 `cursor`로 넘긴다. 명세 Example은
 * 결과가 한 쪽뿐이라 `null`만 보여 줘서 채워졌을 때의 타입은 문자열로 가정했다.
 */
export type OrderListResponse = {
  orders: OrderSummary[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type GetOrdersParams = {
  /** 보일 주문 수. 명세 기본값 10, 최대 50 */
  size?: number;
  /** 다음 쪽을 부를 때 직전 응답의 `nextCursor` */
  cursor?: string | null;
};

/** 내 주문을 최근 것부터 가져온다 */
export async function getOrders({
  size,
  cursor,
}: GetOrdersParams = {}): Promise<OrderListResponse> {
  return apiRequest<OrderListResponse>(ORDERS_PATH, { query: { size, cursor } });
}

/**
 * 받은 물건에 문제가 없다고 확정한다. 상태가 `CONFIRMED`로 넘어간다.
 *
 * **되돌릴 수 없다.** 명세가 돌려주는 것은 `204 No Content`뿐이라 바뀐 주문을 응답으로 받지
 * 못한다. 부르는 쪽이 목록을 다시 조회해 맞춘다.
 */
export async function confirmOrder(orderId: number): Promise<void> {
  await apiRequest<void>(`${ORDERS_PATH}/${orderId}/confirm`, { method: "POST" });
}

/**
 * 주문을 취소한다. 명세는 "취소 완료로 전환"이라고만 적고 상태 값을 밝히지 않는다.
 *
 * 확정과 같이 `204 No Content`라 응답으로는 결과를 알 수 없다.
 */
export async function cancelOrder(orderId: number): Promise<void> {
  await apiRequest<void>(`${ORDERS_PATH}/${orderId}/cancel`, { method: "POST" });
}
