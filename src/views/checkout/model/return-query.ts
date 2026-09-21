// 토스 결제창에서 돌아올 때 우리가 직접 실어 보내는 값.
//
// **결제는 리다이렉트로 돌아온다.** 브라우저가 우리 페이지를 떠났다 오므로 화면이 들고 있던
// 값이 전부 사라진다. 돌아올 때 토스가 붙여 주는 것은 넷뿐이다.
//
// ```
// /payment/done?paymentType=NORMAL&orderId=ORD-…&paymentKey=…&amount=…
// ```
//
// 여기 `orderId`는 **문자열 주문번호**라 주문 상세 라우트(`/mypage/orders/[orderId]`)가 받는
// 숫자 PK가 아니다. 승인 응답도 `paymentId`·`orderNumber`만 주어 숫자 주문 id가 없다.
// 그래서 `[1] POST /orders`가 준 숫자 id를 우리가 `successUrl`에 실어 건너보낸다 (#301).
//
// 토스 문서가 이 방법을 안내한다 — "적은 양의 데이터라면 successUrl의 쿼리 파라미터로
// 추가하세요" (주문서형 결제 연동하기).

/**
 * 우리 주문의 숫자 PK를 싣는 쿼리 이름.
 *
 * **`orderId`로 지으면 안 된다.** 토스가 같은 이름으로 문자열 주문번호를 붙여 둘이 겹친다.
 */
export const ORDER_PARAM = "order";

/** 결제창이 성공으로 돌아올 주소. 숫자 주문 id를 실어 둔다 */
export function toSuccessUrl(origin: string, orderId: number) {
  const url = new URL("/payment/done", origin);
  url.searchParams.set(ORDER_PARAM, String(orderId));
  return url.toString();
}

/**
 * 복귀 쿼리에서 숫자 주문 id를 읽는다. 없거나 이상하면 `null`이다.
 *
 * 주소창으로 직접 들어오거나 예전에 열어 둔 주소로 돌아오는 경우가 있다. 그때 엉뚱한
 * 주문을 여느니 값이 없다고 다루는 편이 낫다.
 */
export function readOrderId(raw: string | undefined): number | null {
  const orderId = Number(raw);
  return raw && Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}
