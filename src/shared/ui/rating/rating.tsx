// 별점을 보여준다. 매기는 것은 별도 컴포넌트로 나눈다.
// UI 시안 기준(mypa_041_작성한의 별 20, 리뷰 작성 1884-29325의 요약 카드)이다. 별은 노란색이고 반 개까지 그린다.

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type RatingProps = {
  /** 0~5. 반 개 단위(4.5)까지 그리고 그 아래는 반올림한다 */
  value: number;
  max?: number;
  /** sm 14px(리뷰 카드), md 20px(목록), lg 28px(리뷰 탭 별점 요약) */
  size?: "sm" | "md" | "lg";
  /** 별 옆에 숫자를 함께 보여준다 */
  showValue?: boolean;
  /**
   * 별 묶음을 화면 낭독기가 읽는 문구. 기본은 "5점 만점에 N점"이다.
   * 아직 평가가 없는 자리에서 0점으로 읽히지 않게 갈아 끼운다.
   */
  srLabel?: string;
  className?: string;
};

/**
 * 별 하나. 채움 정도는 0·0.5·1이고, 반 개는 채운 별의 오른쪽 절반을 잘라낸다.
 * 매기는 쪽(RatingInput)도 같은 별을 쓴다. `className`은 별 크기(size-*)다.
 */
export function RatingStar({ fill, className }: { fill: 0 | 0.5 | 1; className: string }) {
  return (
    // 인라인으로 두면 Safari가 안쪽 absolute 상자의 w-full을 0으로 잡아 채운 별이 잘려 사라진다(#659)
    <span className={cn("relative block shrink-0", className)}>
      <Icon name="star" className="size-full text-icon-fill-disable" />
      {fill > 0 && (
        // 자르는 상자만 절반 폭이고 안의 별은 바깥과 같은 크기라야 작아지지 않고 잘린다
        <span
          className={cn(
            "absolute inset-y-0 left-0 overflow-hidden",
            fill === 0.5 ? "w-1/2" : "w-full",
          )}
        >
          <Icon
            name="star"
            className={cn("absolute top-0 left-0 text-icon-fill-accent", className)}
          />
        </span>
      )}
    </span>
  );
}

export function Rating({
  value,
  max = 5,
  size = "sm",
  showValue,
  srLabel,
  className,
}: RatingProps) {
  const halves = Math.round(value * 2);

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* 별 모양만으로는 값을 읽을 수 없어 스크린 리더용 문장을 따로 둔다 */}
      <span className="sr-only">{srLabel ?? `${max}점 만점에 ${value}점`}</span>
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.max(0, Math.min(2, halves - index * 2));
        return (
          <RatingStar
            key={index}
            fill={fill === 2 ? 1 : fill === 1 ? 0.5 : 0}
            className={size === "sm" ? "size-3.5" : size === "md" ? "size-5" : "size-7"}
          />
        );
      })}
      {showValue &&
        (size === "lg" ? (
          <span aria-hidden className="ml-2 text-title-bold-24 text-text-body-default">
            {value.toFixed(1)}
          </span>
        ) : (
          <span aria-hidden className="ml-1 text-label-medium-11 text-foreground">
            {value.toFixed(1)}
          </span>
        ))}
    </span>
  );
}
