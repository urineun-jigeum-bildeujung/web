// 주문 상태를 뱃지로 보여준다.
// UI 시안 기준(mypa_061 3324:36872 배송준비중 · 3324:36916 배송중 · 3324:36939 배송완료 · 3324:36954 구매확정)이며
// 상태 값은 IA 주문/배송 내역을 따른다.

import { Badge } from "@/shared/ui/badge/badge";

// **결제완료는 따로 두지 않는다.** 시안에 그 뱃지가 없고, PD팀도 "결제 직후~상품 준비까지
// 배송 준비 중으로 묶어도 된다"고 확인해 줬다 (2026-09-21). 서버는 `PAID`와 `PREPARING`을
// 나누지만 화면은 한 단계로 보여준다 (#297).
export const ORDER_STATUSES = ["preparing", "shipping", "delivered", "confirmed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "배송준비중",
  shipping: "배송중",
  delivered: "배송완료",
  confirmed: "구매확정",
};

/**
 * 상태마다 색이 다르다. 2026-09-23 시안부터 그렇다 — 그전 시안은 넷이 모두 같은 회색이었다 (#405).
 *
 * 시안의 `badge/bg/default_weak`·`info_weak`·`positive_weak`가 공용 `Badge`의
 * default·info·positive와 값이 같다. **받은 뒤의 두 단계는 같은 초록이다** — 어느 단계인지는
 * 여전히 색이 아니라 문구가 알린다.
 */
const TONE = {
  preparing: "default",
  shipping: "info",
  delivered: "positive",
  confirmed: "positive",
} as const satisfies Record<OrderStatus, string>;

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge tone={TONE[status]} className={className}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
