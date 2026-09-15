// 짧은 상태·속성 표시. "구매 후 6일", "3번째 구매", 걱정되는 질환 이름처럼 글자 몇 자를 작은 상자에 담는다.
// UI 시안 기준(디자인 시스템 badge. mypa_021 제품 카드·내 아이 관리 카드, onbo_004 고른 값)이다.
//
// 색은 뜻으로 고른다. 기본은 회색, positive는 좋은 신호(재구매), danger는 주의(알러지)다.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm px-1 py-0.5 text-label-medium-12 whitespace-nowrap",
  {
    variants: {
      tone: {
        default: "bg-surface-secondary text-text-body-secondary",
        positive: "bg-surface-positive-weak text-text-body-positive-strong",
        danger: "bg-surface-danger-weak text-text-body-danger-strong",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & ComponentProps<"span">;

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
