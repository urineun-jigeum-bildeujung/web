// 상품이 지금 고른 반려동물에게 얼마나 맞는지를 점수로 보여준다.
// IA 기준(메인·상품 상세·추천·장바구니·상품 비교·리뷰 상세)이며 시안은 아직 없다.
//
// 이 서비스가 별점·인기순 나열과 갈라지는 지점이라, 점수만 던지지 않고
// 무엇에 대한 점수인지 읽히게 한다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type MatchScoreBadgeProps = {
  /** 0~100 */
  score: number;
  /** 어느 아이 기준인지. 넘기면 "코코와 잘 맞아요"처럼 읽힌다 */
  petName?: string;
  size?: "sm" | "md";
} & ComponentProps<"span">;

/** 점수 구간별 표현. 숫자만 보여주면 높은지 낮은지 판단을 사용자에게 떠넘기게 된다 */
export function getMatchLevel(score: number) {
  if (score >= 80) return { label: "잘 맞아요", tone: "high" } as const;
  if (score >= 60) return { label: "맞는 편이에요", tone: "mid" } as const;
  return { label: "확인이 필요해요", tone: "low" } as const;
}

const TONE_CLASS = {
  high: "bg-primary text-primary-foreground",
  mid: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
} as const;

export function MatchScoreBadge({
  score,
  petName,
  size = "md",
  className,
  ...props
}: MatchScoreBadgeProps) {
  const level = getMatchLevel(score);
  const subject = petName ? `${petName}와` : "우리 아이와";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        TONE_CLASS[level.tone],
        className,
      )}
      {...props}
    >
      {/* 색만으로 구간을 구분하지 않도록 구간 문구를 화면에도 함께 보여준다 */}
      <span className="sr-only">{`${subject} ${level.label}. 적합도 ${score}점`}</span>
      <span aria-hidden className="font-semibold">
        {score}
      </span>
      <span aria-hidden>{level.label}</span>
    </span>
  );
}
