// 추천 상품 사진 위에 얹는 판매 상태 배지. 판매 중이면 아무것도 그리지 않는다.
// 색은 타임딜 목록의 재고 배지(1905-32428)를 따른다 — 품절은 짙은 배경, 타임딜은 브랜드색이다.
//
// 품절 상품도 목록에서 빼지 않는다. 누르면 상품 상세로 가고, 재입고 알림은 그 화면이 맡는다(views/product-detail).

import { cn } from "@/shared/lib/utils";

import type { SaleStatus } from "../model/recommendation";

const BADGE = {
  soldOut: { label: "품절", className: "bg-primary text-primary-foreground" },
  timeDeal: { label: "타임딜", className: "bg-brand text-brand-foreground" },
} as const;

type SaleStatusBadgeProps = {
  status: SaleStatus;
  className?: string;
};

export function SaleStatusBadge({ status, className }: SaleStatusBadgeProps) {
  if (status === "onSale") return null;
  const { label, className: tone } = BADGE[status];
  return (
    <span
      className={cn("inline-flex rounded-sm px-1 py-0.5 text-label-medium-12", tone, className)}
    >
      {label}
    </span>
  );
}
