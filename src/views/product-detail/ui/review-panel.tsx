// 상품 상세의 리뷰 탭. 별점 요약과 후기 목록을 담는다.
// 와이어프레임 기준(상품 상세_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 시안의 필터는 둘로 갈린다. 자동은 지금 고른 아이 기준으로 한 번에 거르는 토글이고,
// 수동은 조건을 직접 고르는 바텀시트다(#149). 이 파일은 토글과 정렬까지만 맡는다.

"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { ReviewCard } from "@/entities/review";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Label } from "@/shared/ui/label";
import { Rating } from "@/shared/ui/rating/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

import {
  MOCK_REVIEWS,
  REVIEW_SORTS,
  REVIEW_SORT_LABEL,
  type ReviewSort,
} from "../model/mock-reviews";

/** 목업 정렬 규칙. 연동하면 서버가 정렬해 주므로 이 자리는 통째로 사라진다 */
const COMPARE: Record<
  ReviewSort,
  (a: (typeof MOCK_REVIEWS)[number], b: (typeof MOCK_REVIEWS)[number]) => number
> = {
  recommend: (a, b) => b.likeCount - a.likeCount,
  recent: (a, b) => b.date.localeCompare(a.date),
  "rating-high": (a, b) => b.rating - a.rating,
  "rating-low": (a, b) => a.rating - b.rating,
};

/** "말티즈 · 8세 · 4kg"에서 품종만 뗀다 */
function breedOf(profileLabel: string) {
  return profileLabel.split("·")[0].trim();
}

type ReviewPanelProps = {
  rating: number;
  reviewCount: number;
  /** 지금 고른 아이. 맞춤보기를 켜면 이 아이와 같은 품종의 후기만 남는다 */
  petProfileLabel: string;
};

export function ReviewPanel({ rating, reviewCount, petProfileLabel }: ReviewPanelProps) {
  // 정렬과 맞춤보기는 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다.
  // 쌓으면 뒤로가기를 여러 번 눌러야 화면을 떠난다
  const [sort, setSort] = useQueryState(
    "reviewSort",
    parseAsStringLiteral(REVIEW_SORTS).withDefault("recommend"),
  );
  const [matchOnly, setMatchOnly] = useQueryState("reviewMatch", {
    defaultValue: "off",
  });

  const on = matchOnly === "on";
  const breed = breedOf(petProfileLabel);

  // 실제로는 조건을 요청 파라미터로 넘겨 서버가 걸러 준다.
  // 목업 단계라 화면에서 거르고 정렬한다
  const reviews = MOCK_REVIEWS.filter((review) => !on || breedOf(review.petProfile) === breed).sort(
    COMPARE[sort],
  );

  return (
    <div className="flex flex-col">
      <section aria-label="별점 요약" className="flex flex-col items-center gap-1 px-4 py-5">
        <Rating value={rating} size="md" showValue />
        <p className="text-xs text-muted-foreground">총 리뷰 {reviewCount}개</p>
      </section>

      <div className="h-2 bg-muted" />

      {/* 조건을 직접 고르는 바텀시트와 리뷰 사진 줄은 #149·#151에서 이 자리에 붙는다 */}
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="review-match"
              checked={on}
              onCheckedChange={(next) => void setMatchOnly(next ? "on" : "off")}
            />
            <Label htmlFor="review-match" className="text-sm text-foreground">
              내 반려동물 맞춤보기
            </Label>
          </div>

          <Select value={sort} onValueChange={(next) => void setSort(next as ReviewSort)}>
            <SelectTrigger aria-label="리뷰 정렬" className="min-h-11 w-auto border-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {REVIEW_SORTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {REVIEW_SORT_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {on && (
          <p className="text-xs text-muted-foreground">{breed}와 함께 쓴 후기만 보고 있어요</p>
        )}
      </div>

      {reviews.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="px-4 py-5">
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="조건에 맞는 후기가 없어요"
          description="맞춤보기를 끄면 모든 후기를 볼 수 있어요."
          className="py-10"
        />
      )}
    </div>
  );
}
