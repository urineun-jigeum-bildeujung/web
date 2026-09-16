// 짧은 상태·속성 표시. "구매 후 6일", "3번째 구매", 걱정되는 질환 이름처럼 글자 몇 자를 작은 상자에 담는다.
// UI 시안 기준(디자인 시스템 badge. mypa_021 제품 카드·내 아이 관리 카드, onbo_004 고른 값)이다.
//
// 색은 뜻으로 고른다. 기본은 회색, positive는 좋은 신호(재구매), danger는 주의(알러지),
// info는 안내(알림), brand는 꼭 채워야 하는 항목(필수), strong은 강조(기본 배송지)다.
// 채움(fill, 기본)·테두리(outline) 두 모양이 있다 — 시안의 state=weak/line에 대응한다.
// 같은 뜻(tone)이라도 화면마다 다른 모양을 쓴다 (메인 최근 구매 카드는 outline, 마이페이지는 fill).

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm px-1 py-0.5 text-label-medium-12 whitespace-nowrap",
  {
    variants: {
      tone: {
        default: "text-text-body-secondary",
        positive: "text-text-body-positive-strong",
        danger: "text-text-body-danger-strong",
        info: "text-text-body-info-strong",
        brand: "text-text-body-brand-strong",
        // 검정 바탕에 흰 글자. "기본 배송지"처럼 눈에 띄어야 하는 표시
        strong: "text-primary-foreground",
      },
      variant: {
        fill: "",
        outline: "border",
      },
    },
    compoundVariants: [
      { tone: "default", variant: "fill", class: "bg-surface-secondary" },
      { tone: "positive", variant: "fill", class: "bg-surface-positive-weak" },
      { tone: "danger", variant: "fill", class: "bg-surface-danger-weak" },
      { tone: "info", variant: "fill", class: "bg-surface-info-weak" },
      { tone: "brand", variant: "fill", class: "bg-surface-brand-weak" },
      { tone: "strong", variant: "fill", class: "bg-primary" },
      // 시안(2번째 구매 배지)이 확인된 default 조합만 정확한 테두리색을 넣는다.
      // 나머지 tone의 outline은 아직 시안에서 확인된 적이 없다.
      { tone: "default", variant: "outline", class: "border-border-secondary" },
    ],
    defaultVariants: {
      tone: "default",
      variant: "fill",
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & ComponentProps<"span">;

export function Badge({ tone, variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, variant }), className)} {...props} />;
}
