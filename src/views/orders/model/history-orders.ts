// 주문내역 탭에 세울 주문을 가린다. 결제를 끝내지 않은 주문과 취소한 주문은 이 탭에 서지 않는다.
//
// **서버가 거르지 않아 화면이 거른다.** `GET /orders`는 `size`·`cursor`만 받고 회원의 주문을
// 상태와 상관없이 모두 준다(백엔드 `findByMemberIdWithCursor`) (#462).

import type { OrderSummary } from "@/entities/order";

/**
 * 이 탭에 세우지 않는 상태.
 *
 * - `PENDING` — 결제를 끝내지 않은 주문. PD팀이 "주문 내역에 표시하지 않는다"고 정했다(2026-09-28).
 *   결제창을 닫고 나가면 그대로 남는다 — 서버에 만료시키는 일정 작업이 없다.
 * - `CANCELLED` — 취소·반품·교환 탭에서 다룬다(같은 날 PD 답). 결제 실패·재고 부족으로 결제 없이
 *   취소된 주문도 이 값이라, 그쪽 탭이 결제한 것만 다시 고른다.
 */
const HIDDEN_STATUSES = new Set(["PENDING", "CANCELLED"]);

/** 주문내역 탭에 세울 주문인가. 대소문자만 다른 값도 같은 상태로 본다 */
export function isHistoryOrder(order: OrderSummary): boolean {
  return !HIDDEN_STATUSES.has(order.orderStatus.toUpperCase());
}
