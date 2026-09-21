// 서버가 주는 주문 상태 문자열을 화면이 쓰는 상태로 옮긴다.
//
// **아는 값만 통과시킨다.** 2026-09-21 기준 백엔드 `API 명세`에서 확인된 것은 셋뿐이다 —
// 목록·상세 Example의 `PAID`·`DELIVERED`, 구매 확정(`POST /orders/{orderId}/confirm`)이
// 만든다고 적힌 `CONFIRMED`. 배송준비중·배송중·취소에 해당하는 값은 명세 어디에도 없다.
//
// 그래서 `PREPARING`·`SHIPPING` 같은 이름을 넣어 두지 않았다. 맞을 법하지만 확인된 적이 없고,
// 틀리면 그 주문만 상태 없이 조용히 지나간다. 모르는 값은 `null`로 돌려 화면이 뱃지와 행동
// 버튼을 감추게 하고, 백엔드에 값 목록을 물어 답이 오면 여기만 채운다 (#284).

import type { OrderStatus } from "../ui/order-status-badge";

/** 명세에서 실제로 확인한 서버 값만 둔다. 추측으로 늘리지 않는다 */
const SERVER_TO_VIEW: Record<string, OrderStatus> = {
  PAID: "paid",
  DELIVERED: "delivered",
  CONFIRMED: "confirmed",
};

/**
 * 서버 상태를 화면 상태로 옮긴다. 모르는 값이면 `null`이다.
 *
 * 대소문자만 다른 경우까지 놓치지 않도록 위로 맞춰 본다.
 */
export function toOrderStatus(serverStatus: string): OrderStatus | null {
  return SERVER_TO_VIEW[serverStatus.toUpperCase()] ?? null;
}
