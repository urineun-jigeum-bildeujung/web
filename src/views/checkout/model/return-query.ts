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

import { BUY_NOW_PARAM } from "@/entities/cart";

import { ITEMS_PARAM } from "./order-items";

/**
 * 우리 주문의 숫자 PK를 싣는 쿼리 이름.
 *
 * **`orderId`로 지으면 안 된다.** 토스가 같은 이름으로 문자열 주문번호를 붙여 둘이 겹친다.
 */
export const ORDER_PARAM = "order";

/**
 * 이번 주문만 받을 배송지를 싣는 쿼리 이름 (QA No.40, #595).
 *
 * **회원의 기본 배송지(`isDefault`)는 건드리지 않는다.** 배송지 설정에서 고른 곳은 이 주문 한 번만
 * 쓰는 값이라 서버에 적지 않고 주소창이 들고 다닌다 — 새로고침·결제창 실패 복귀에도 남아야 한다
 * (AGENTS.md 5.1 "URL 쿼리").
 */
export const ADDRESS_PARAM = "address";

/**
 * 결제 화면이 들고 다니는 쿼리만 추린다.
 *
 * **고른 것(`items`·`buy`)과 고른 배송지(`address`)만 옮긴다.** 복귀 주소에는 토스가 붙인
 * `code`·`message`·`orderId`도 있는데 그것까지 실어 돌면 실패 안내가 옛 값으로 다시 뜨고 주소가
 * 회차마다 길어진다. 바로 구매(`buy`)가 빠지면 장바구니 전체가 결제 대상으로 읽힌다 (#520).
 */
function checkoutQuery(search: string) {
  const query = new URLSearchParams();
  const from = new URLSearchParams(search);
  const items = from.get(ITEMS_PARAM);
  // **빈 문자열도 값이다.** `?items=`는 전체가 아니라 빈 선택이라 그대로 되돌려야 한다
  if (items !== null) {
    query.set(ITEMS_PARAM, items);
  }
  // 빈 값도 옮긴다. 빼면 장바구니 결제로 읽혀 고르지 않은 상품이 결제 대상이 된다
  const buyNow = from.get(BUY_NOW_PARAM);
  if (buyNow !== null) {
    query.set(BUY_NOW_PARAM, buyNow);
  }
  // 빠지면 결제창에서 실패로 돌아오거나 배송지를 등록하고 올 때 고른 곳이 기본 배송지로 돌아간다
  const address = from.get(ADDRESS_PARAM);
  if (address !== null) {
    query.set(ADDRESS_PARAM, address);
  }
  return query;
}

function withQuery(path: string, query: URLSearchParams) {
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

/** 지금 고른 것을 그대로 들고 결제 화면으로 돌아오는 경로 */
export function toCheckoutPath(search: string) {
  return withQuery("/payment", checkoutQuery(search));
}

/**
 * 배송지 설정으로 가는 경로. **고른 것을 그대로 들고 간다** — 거기서 배송지를 고르면 이 값에
 * `address`만 바꿔 결제 화면으로 돌아온다 (#595).
 */
export function toAddressPickerPath(search: string) {
  return withQuery("/payment/address", checkoutQuery(search));
}

/** 배송지 설정에서 한 곳을 골라 결제 화면으로 돌아가는 경로. 고른 상품은 그대로 둔다 (#595) */
export function toPickedAddressPath(search: string, addressId: number) {
  const query = checkoutQuery(search);
  query.set(ADDRESS_PARAM, String(addressId));
  return withQuery("/payment", query);
}

/**
 * 주소의 배송지 id를 읽는다. 없거나 이상하면 `null`이고, 그때는 기본 배송지를 쓴다.
 *
 * 주소창으로 고쳐 들어온 값이나 지운 배송지를 가리키는 옛 주소가 있다. 목록에 없는 id는 부르는
 * 쪽이 찾지 못해 기본 배송지로 돌아간다.
 */
export function readAddressId(raw: string | null): number | null {
  const addressId = Number(raw);
  return raw && Number.isSafeInteger(addressId) && addressId > 0 ? addressId : null;
}

/**
 * 결제창이 실패·취소로 돌아올 주소. **고른 상품을 되돌려 싣는다.**
 *
 * 그전에는 `${origin}/payment` 한 줄이었다. 그러면 `items`가 빠진 채 돌아와 고른 것이
 * 장바구니 전체로 읽히고, 실패 안내를 보고 다시 누른 사용자가 **고르지 않은 상품까지**
 * 주문하게 된다 (#364).
 */
export function toFailUrl(origin: string, search: string) {
  return new URL(toCheckoutPath(search), origin).toString();
}

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
