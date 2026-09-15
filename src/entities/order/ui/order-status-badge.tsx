// 주문 상태를 뱃지로 보여준다.
// UI 시안 기준(mypa_061, 287:8543)이며 상태 값은 IA 주문/배송 내역을 따른다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export const ORDER_STATUSES = ["paid", "preparing", "shipping", "delivered", "confirmed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "결제완료",
  preparing: "배송준비중",
  shipping: "배송중",
  delivered: "배송완료",
  confirmed: "구매확정",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
} & ComponentProps<"span">;

export function OrderStatusBadge({ status, className, ...props }: OrderStatusBadgeProps) {
  return (
    <span
      // 시안은 다섯 상태를 모두 같은 색으로 둔다. 어느 단계인지는 색이 아니라 문구가 알린다
      className={cn(
        "inline-flex items-center rounded-sm bg-surface-tertiary px-2 py-1 text-label-medium-12 text-foreground",
        className,
      )}
      {...props}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
