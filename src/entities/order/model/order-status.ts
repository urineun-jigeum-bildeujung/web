// 서버가 주는 주문 상태 문자열을 화면이 쓰는 상태로 옮긴다.
//
// **값은 백엔드 `OrderStatus` enum에서 확인했다** (2026-09-21, `order-service`의
// `domain/order/OrderStatus.java`). 명세 Example에는 `PAID`·`DELIVERED`·`CONFIRMED` 셋만
// 나와 있어 그때는 셋만 통과시켰는데, enum에는 아홉이 있고 전이 규칙까지 함께 적혀 있다.
//
// ```
// PENDING(결제대기) → PAID(결제완료) → PREPARING(상품준비) → SHIPPING(배송중)
//                  → DELIVERED(배송완료) → CONFIRMED(구매확정)
// CANCELLED(취소) · PARTIAL_REFUND(부분환불) · REFUNDED(환불완료)
// ```
//
// **아래 다섯만 옮긴다.** 시안(mypa_061)이 그리는 뱃지가 다섯이고 나머지 넷에 해당하는
// 자리가 없다. 결제 전(`PENDING`)은 주문 목록에 설 일이 없고, **취소·환불된 주문의 시안은
// 오는 중이다** — 2026-09-21 PD 회신이 "취소 완료 화면"과 "여러 개 주문 시 부분 환불"을
// 내일 전달한다고 했다(#344).
//
// **`CANCELLED`는 실제로 쓰인다.** 같은 날 백엔드도 "주문 취소에 따라 CANCELLED도 사용될 것
// 같습니다"라고 답했다. 시안이 오면 여기에 더한다.
//
// **`SHIPPING`·`DELIVERED`로 넘어가는 길은 아직 없다.** 백엔드가 "스케줄링을 통해 임시로 값을
// 바꾸는 방법을 생각했었는데 개발 일정과 중요도에 따라 후순위로 미뤄졌다"고 했다. 시연에서는
// DB를 직접 고치거나 그 상태의 목데이터를 넣어야 한다 — **반품·교환 버튼은 배송완료에만 뜬다.**
//
// 모르는 값은 `null`로 돌려 화면이 뱃지와 행동 버튼을 감춘다 —
// 없는 단계를 지어내는 것보다 비워 두는 쪽이 낫다 (#288).

import type { OrderStatus } from "../ui/order-status-badge";

/**
 * 백엔드 enum에서 확인한 값만 둔다. 추측으로 늘리지 않는다.
 *
 * **`PAID`와 `PREPARING`이 한 자리로 간다.** 시안에 "결제완료" 뱃지가 없어 PD팀에 물었더니
 * 결제 직후부터 상품 준비까지 배송 준비 중으로 묶어도 된다고 했다 (#297).
 */
const SERVER_TO_VIEW: Record<string, OrderStatus> = {
  PAID: "preparing",
  PREPARING: "preparing",
  SHIPPING: "shipping",
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
