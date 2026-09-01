// 상품 가격을 정가·할인가·할인율로 보여준다. 단가는 카테고리에 따라 라벨이 달라진다.
// IA 기준(메인·검색 결과·상품 상세·타임딜·장바구니)이며 시안은 아직 없다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type PriceProps = {
  /** 실제로 낼 금액 */
  amount: number;
  /** 할인 전 금액. amount보다 클 때만 취소선과 할인율을 보여준다 */
  originalAmount?: number;
  /** "하루 급여 480원"처럼 아래 붙는 보조 표기 */
  unitLabel?: string;
  unitAmount?: number;
  size?: "sm" | "md" | "lg";
} & ComponentProps<"div">;

const SIZE_CLASS = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

/** 할인율은 버림으로 계산한다. 19.9%를 20%로 올리면 실제보다 싸 보인다 */
export function calcDiscountRate(amount: number, originalAmount: number) {
  if (originalAmount <= 0 || amount >= originalAmount) return 0;
  return Math.floor(((originalAmount - amount) / originalAmount) * 100);
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function Price({
  amount,
  originalAmount,
  unitLabel,
  unitAmount,
  size = "md",
  className,
  ...props
}: PriceProps) {
  const discountRate = originalAmount ? calcDiscountRate(amount, originalAmount) : 0;

  return (
    <div className={cn("flex flex-col gap-0.5", className)} {...props}>
      {/* 금액 가운데서 줄이 바뀌면 "26,000 / 원"처럼 읽힌다. 좁으면 원가만 아래로 내린다. */}
      <div className="flex flex-wrap items-baseline gap-x-1.5 whitespace-nowrap">
        {discountRate > 0 && (
          <span className={cn("font-bold text-destructive", SIZE_CLASS[size])}>
            {discountRate}%
          </span>
        )}
        <span className={cn("font-bold text-foreground", SIZE_CLASS[size])}>
          {formatWon(amount)}
        </span>
        {discountRate > 0 && originalAmount && (
          <span className="text-xs text-muted-foreground line-through">
            {formatWon(originalAmount)}
          </span>
        )}
      </div>

      {unitLabel && unitAmount !== undefined && (
        <span className="text-xs text-muted-foreground">
          {unitLabel} {formatWon(unitAmount)}
        </span>
      )}
    </div>
  );
}
