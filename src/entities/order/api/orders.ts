// 주문 API. 목록·상세를 가져오고 구매 확정·주문 취소를 보낸다.
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
   * **문자열로 둔다.** 백엔드 `OrderStatus`는 아홉이지만(`order-status.ts` 참고) 화면이
   * 다섯만 그린다. 좁은 유니온으로 막으면 그리지 않는 값이 올 때 타입만 맞고 화면이
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
 * 상세에만 오는 상품 필드.
 *
 * `unitPrice`는 **낱개 값**이다. 명세 Example이 20,000원과 15,000원짜리 하나씩에
 * `productAmount` 35,000원이라 수량을 곱한 값이 아니다.
 */
/**
 * 그 상품에 걸린 클레임 한 건. 백엔드 `OrderDetailResponse.ClaimSummary` 그대로다.
 *
 * **신청 화면이 이것을 읽는다.** 진행 중인 신청이 걸린 상품을 고르면 서버가 요청 전체를
 * 거절하므로(`ORDER_409_CLAIM_ALREADY_IN_PROGRESS`) 미리 뺀다 (#322, #327).
 */
export type OrderItemClaim = {
  claimId: number;
  /** `CANCEL`·`RETURN`·`EXCHANGE` */
  claimType: string;
  /**
   * 백엔드 `ClaimStatus`. `REQUESTED` → `COLLECTING` → `INSPECTING` → `COMPLETED`이고
   * 어느 단계에서든 `REJECTED`로 끝날 수 있다. 끝난 것은 뒤의 둘이다(`terminalStates`).
   */
  claimStatus: string;
  /** ISO 8601 */
  requestedAt: string;
  /** 아직 끝나지 않았으면 없다 */
  completedAt: string | null;
};

export type OrderDetailItem = OrderListItem & {
  unitPrice: number;
  /**
   * 상품별 상태. 주문 전체 상태와 따로 움직인다 — 한 상품만 반품 중일 수 있다.
   *
   * 백엔드 `OrderItemStatus`는 `PAID`·`CANCELLED`·`PARTIAL_RETURN`·`RETURNED` 넷이다.
   * 화면이 아직 쓰지 않아 좁히지 않고 문자열로 둔다.
   */
  itemStatus: string;
  /** 취소된 수량 */
  cancelledQuantity: number;
  /** 반품된 수량 */
  returnedQuantity: number;
  /**
   * 아직 살아 있는 수량 — `quantity - cancelledQuantity - returnedQuantity`.
   *
   * **새 신청의 상한이다.** 서버 `CreateClaimService`가 이 값으로 막으므로 화면도 같이 막는다.
   * 그전에는 응답에 없어 주문 수량을 상한으로 썼고, 2개 산 상품을 1개 반품한 뒤에도
   * 2개를 고를 수 있었다 (#374).
   */
  effectiveQuantity: number;
  /** 그 상품에 걸린 클레임들. 없으면 빈 배열이다 */
  claims: OrderItemClaim[];
};

/** 주문에 붙은 배송지. 배송지 등록 API와 달리 연락처 이름이 `receiverPhone`이다 */
export type OrderDeliveryAddress = {
  receiver: string;
  receiverPhone: string;
  zipCode: string;
  /** 도로명 주소. 상세 주소는 `addressDetail`에 따로 온다 */
  address: string;
  addressDetail: string;
};

export type OrderPayment = {
  /** ISO 8601 */
  paidAt: string;
  /** `"토스페이먼츠 결제"`처럼 이미 다듬어진 문자열 */
  method: string;
};

/**
 * 주문 상세.
 *
 * **배송비 필드가 없다.** 명세가 주는 것은 상품 금액(`productAmount`)과 결제 금액
 * (`totalAmount`) 둘뿐이라 차액이 배송비다. 기능명세서가 배송비를 3,000원 고정으로
 * 적어 두었고 Example의 차액도 3,000원이라 맞지만, 계산해 쓰는 것이라 화면 쪽에서
 * 한 번만 빼도록 둔다.
 *
 * **`orderedAt`이 없다.** 목록에는 오지만 상세 응답에는 없다. 시안(`mypa_161`)도
 * 주문 일자를 그리지 않아 지금은 모자라지 않는다.
 */
export type OrderDetail = {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  /**
   * 배송이 끝난 시각. 끝나지 않았으면 `null`이다.
   *
   * **반품·교환은 이 시각부터 7일 안에만 받는다.** 서버 `Order.isClaimable`이
   * `deliveredAt.plusDays(7).isAfter(now())`로 막는다 (#374).
   */
  deliveredAt: string | null;
  /** 배송비를 뺀 상품 금액의 합 */
  productAmount: number;
  totalAmount: number;
  items: OrderDetailItem[];
  deliveryAddress: OrderDeliveryAddress;
  /** 배송 요청사항. 남기지 않고 주문할 수 있다 */
  /** 요청사항 없이 주문할 수 있다. 서버 `OrderDetailResponse`가 그대로 `null`을 담는다 (#318) */
  deliveryNote: string | null;
  /**
   * 결제 정보. **아직 결제되지 않은 주문에는 없다.**
   *
   * 백엔드 `OrderDetailResponse.from`이 `result.payment()`가 비면 `null`을 담는다.
   * 주문은 결제 전(`PENDING`)에도 만들어지므로 그 사이에 상세를 열면 여기가 빈다.
   */
  payment: OrderPayment | null;
};

/** 주문 하나를 배송지·결제 정보까지 가져온다 */
export async function getOrderDetail(orderId: number): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`${ORDERS_PATH}/${orderId}`);
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
