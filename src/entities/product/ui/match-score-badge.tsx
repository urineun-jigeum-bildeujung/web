// 상품이 지금 고른 반려동물에게 얼마나 맞는지를 점수로 보여준다.
// UI 시안 기준(홈 화면 ProductCard/Grid의 slot_1 배지, node 1758:68918 등). 상품
// 이미지 좌상단에 브랜드색으로 채운 사각 배지 하나만 있고, 점수 구간별 색·문구
// 구분은 시안에 없다.
//
// 이 서비스가 별점·인기순 나열과 갈라지는 지점이라, 점수만 던지지 않고
// 무엇에 대한 점수인지 스크린 리더로 읽히게 한다.
//
// 아직 재지 않은 상품(score가 null)은 시안에 이 배지가 아예 없지만, 검색 결과
// 화면(#119)은 영양 정보 미등록 상품에 "정보 확인 중"을 보여주기로 이미 정해져
// 있다. 0점으로 내려보내면 "궁합이 나쁜 상품"처럼 읽혀 아직 안 잰 것과 헷갈린다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type MatchScoreBadgeProps = {
  /** 0~100. 영양 정보가 없어 계산하지 못했으면 null */
  score: number | null;
  /** 어느 아이 기준인지. 스크린 리더 문구("코코와 적합도 98점")에만 쓰인다 */
  petName?: string;
} & ComponentProps<"span">;

/** 점수 구간별 표현. `views/product-detail`의 MatchPanel과, null일 때의 문구를
 * 이 배지 자신도 함께 쓴다. 숫자만 보여주면 높은지 낮은지 판단을 사용자에게 떠넘기게 된다 */
export function getMatchLevel(score: number | null) {
  if (score === null) return { label: "정보 확인 중", tone: "unknown" } as const;
  if (score >= 80) return { label: "잘 맞아요", tone: "high" } as const;
  if (score >= 60) return { label: "맞는 편이에요", tone: "mid" } as const;
  return { label: "확인이 필요해요", tone: "low" } as const;
}

export function MatchScoreBadge({ score, petName, className, ...props }: MatchScoreBadgeProps) {
  const subject = petName ? `${petName}와` : "우리 아이와";

  if (score === null) {
    const { label } = getMatchLevel(score);
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-sm border border-border bg-background px-1 py-0.5 text-label-medium-12 text-muted-foreground",
          className,
        )}
        {...props}
      >
        <span className="sr-only">
          {subject} 얼마나 맞는지 아직 알 수 없어요. 상품 정보를 확인하는 중입니다
        </span>
        <span aria-hidden>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-brand px-1 py-0.5 text-label-medium-12 text-brand-foreground",
        className,
      )}
      {...props}
    >
      <span className="sr-only">
        {subject} 적합도 {score}점
      </span>
      <span aria-hidden>적합도 {score}점</span>
    </span>
  );
}
