// 주문 상태를 뱃지로 보여준다.
// 와이어프레임 기준(mypa_051)이며 상태 값은 IA 주문/배송 내역을 따른다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export const ORDER_STATUSES = ["paid", "preparing", "shipping", "delivered", "confirmed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "결제완료",
  preparing: "상품 준비",
  shipping: "배송중",
  delivered: "배송완료",
  confirmed: "구매확정",
};

/** 진행 중인 것과 끝난 것을 눈으로 가른다. 색만으로 구분하지 않도록 문구가 항상 함께 나온다 */
const TONE: Record<OrderStatus, string> = {
  paid: "bg-secondary text-secondary-foreground",
  preparing: "bg-secondary text-secondary-foreground",
  shipping: "bg-primary text-primary-foreground",
  delivered: "bg-muted text-muted-foreground",
  confirmed: "bg-muted text-muted-foreground",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
} & ComponentProps<"span">;

export function OrderStatusBadge({ status, className, ...props }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        TONE[status],
        className,
      )}
      {...props}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
