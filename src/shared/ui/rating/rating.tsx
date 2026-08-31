// 별점을 보여준다. 매기는 것은 별도 컴포넌트로 나눈다.
// IA 기준(상품 상세·리뷰 목록·리뷰 상세·작성한 리뷰)이며 시안은 mypa_031_작성한이다.

import { IoStar, IoStarOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type RatingProps = {
  /** 0~5 */
  value: number;
  max?: number;
  size?: "sm" | "md";
  /** 별 옆에 숫자를 함께 보여준다 */
  showValue?: boolean;
  className?: string;
};

export function Rating({ value, max = 5, size = "sm", showValue, className }: RatingProps) {
  const filled = Math.round(value);

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {/* 별 모양만으로는 값을 읽을 수 없어 스크린 리더용 문장을 따로 둔다 */}
      <span className="sr-only">{`5점 만점에 ${value}점`}</span>
      {Array.from({ length: max }, (_, index) => {
        const Icon = index < filled ? IoStar : IoStarOutline;
        return (
          <Icon
            key={index}
            aria-hidden
            className={cn(
              size === "sm" ? "size-3.5" : "size-4",
              index < filled ? "text-foreground" : "text-muted-foreground/40",
            )}
          />
        );
      })}
      {showValue && (
        <span aria-hidden className="ml-1 text-xs text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
