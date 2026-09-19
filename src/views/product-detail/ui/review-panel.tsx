// 상품 상세의 리뷰 탭. 별점 요약과 후기 목록을 담는다.
// UI 시안(1716:34322)의 리뷰 탭 구성에 맞춘다.
//
// 시안의 필터는 둘로 갈린다. 자동은 지금 고른 아이 기준으로 한 번에 거르는 토글이고,
// 수동은 조건을 직접 고르는 바텀시트다(#149). 이 파일은 토글과 정렬까지만 맡는다.
//
// AI 리뷰 요약 카드(#152)는 진행하지 않기로 결정했다(2026-09-17).
// 이 화면의 시안에 그 카드가 보여도 만들지 않는다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { IoImageOutline } from "react-icons/io5";

import {
  MOCK_REVIEWS,
  PHOTO_REVIEWS,
  PHOTO_TOTAL,
  REVIEW_SORTS,
  REVIEW_SORT_LABEL,
  ReviewCard,
  type ReviewSort,
} from "@/entities/review";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Label } from "@/shared/ui/label";
import { Rating } from "@/shared/ui/rating/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

import {
  DEFAULT_FILTER,
  applyFilter,
  isDefault,
  parseFilter,
  serializeFilter,
  type ReviewFilter,
} from "../model/review-filter";
import { ReviewFilterSheet } from "./review-filter-sheet";

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

const MATCH_STATES = ["on", "off"] as const;

/** 사진 수만큼 썸네일 자리를 만든다. 리뷰 수로 자르면 사진 6장이어도 두 칸만 나온다.
    reviewIndex는 PHOTO_REVIEWS 안 자리라 사진 리뷰 화면의 review 쿼리와 그대로 맞는다 */
const PHOTO_PREVIEWS = PHOTO_REVIEWS.flatMap((review, reviewIndex) =>
  Array.from({ length: review.photoCount }, (_, index) => ({ review, reviewIndex, index })),
).slice(0, 4);

/** "말티즈 · 8세 · 4kg"에서 품종만 뗀다 */
function breedOf(profileLabel: string) {
  return profileLabel.split("·")[0].trim();
}

type ReviewPanelProps = {
  productId: string;
  rating: number;
  reviewCount: number;
  /** 지금 고른 아이. 맞춤보기를 켜면 이 아이와 같은 품종의 후기만 남는다 */
  petProfileLabel: string;
};

export function ReviewPanel({ productId, rating, reviewCount, petProfileLabel }: ReviewPanelProps) {
  const router = useRouter();

  // 정렬과 맞춤보기는 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다.
  // 쌓으면 뒤로가기를 여러 번 눌러야 화면을 떠난다
  const [sort, setSort] = useQueryState(
    "reviewSort",
    parseAsStringLiteral(REVIEW_SORTS).withDefault("recommend"),
  );
  // 보기가 둘뿐이라 검증하는 파서를 쓴다. 그냥 문자열로 두면 ?reviewMatch=asdf가
  // 주소에 남은 채 꺼진 것처럼 동작한다
  const [matchOnly, setMatchOnly] = useQueryState(
    "reviewMatch",
    parseAsStringLiteral(MATCH_STATES).withDefault("off"),
  );
  // 조건이 여섯이라 키를 하나씩 두면 주소가 길어진다. 한 칸에 묶어 싣는다.
  // 형식이 자유로워 literal로 막을 수 없는 대신 parseFilter가 값을 검증한다
  const [filterParam, setFilterParam] = useQueryState("reviewFilter", { defaultValue: "" });

  const on = matchOnly === "on";
  const breed = breedOf(petProfileLabel);
  const filter = parseFilter(filterParam);

  const applyReviewFilter = (next: ReviewFilter) =>
    void setFilterParam(isDefault(next) ? "" : serializeFilter(next));

  // 실제로는 조건을 요청 파라미터로 넘겨 서버가 걸러 준다.
  // 목업 단계라 화면에서 거르고 정렬한다
  const matched = MOCK_REVIEWS.filter((review) => !on || breedOf(review.petProfile) === breed);
  const reviews = applyFilter(matched, filter).sort(COMPARE[sort]);

  return (
    <div className="flex flex-col">
      <section aria-label="별점 요약" className="flex flex-col items-start gap-1 p-5">
        <Rating value={rating} size="lg" showValue />
        <p className="text-body-medium-14 text-text-body-secondary">총 리뷰 {reviewCount}개</p>
      </section>

      <div className="h-2 bg-muted" />

      {PHOTO_TOTAL > 0 && (
        <section aria-labelledby="review-photos" className="flex flex-col gap-3 px-5 py-3">
          <div className="flex items-center justify-between">
            <h3 id="review-photos" className="text-title-bold-16 text-text-body-default">
              리뷰 사진
            </h3>
            <Link
              href={`/products/${productId}/photos`}
              className="flex min-h-11 min-w-11 items-center justify-center text-body-medium-14 text-text-body-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              전체보기
            </Link>
          </div>

          {/* 사진 앞의 넉 장만 미리 보인다. 나머지는 전체보기에서 격자로 본다.
              4열 정사각 그리드라 393px보다 좁은 화면에서도 폭을 넘지 않는다 */}
          <ul className="grid grid-cols-4 gap-1">
            {PHOTO_PREVIEWS.map(({ review, reviewIndex, index }) => (
              <li key={`${review.id}-${index}`}>
                <Link
                  href={`/products/${productId}/photos?review=${reviewIndex}&photo=${index}`}
                  aria-label={`${review.nickname}의 후기 사진 ${index + 1}번째 보기`}
                  className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <IoImageOutline aria-hidden className="size-6 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="h-2 bg-muted" />

      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* 시안(1716-34322)의 "상품 옵션" 칩. 이 상품이 옵션 하나뿐인 목데이터라
                실제로 고를 것이 없어 지금은 자리만 두고 눌러도 아무 일도 하지 않는다 */}
            <button
              type="button"
              disabled
              className="relative flex h-8 items-center gap-1 rounded-full border border-border px-3 py-2 text-label-medium-12 text-text-body-default after:absolute after:inset-x-0 after:-inset-y-1.5 disabled:opacity-100"
            >
              상품 옵션
              <Icon name="down" aria-hidden className="size-5 text-icon-stroke-tertiary" />
            </button>
            <ReviewFilterSheet
              filter={filter}
              onApply={applyReviewFilter}
              countOf={(next) => applyFilter(matched, next).length}
            />
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

          {!isDefault(filter) && (
            <button
              type="button"
              onClick={() => applyReviewFilter(DEFAULT_FILTER)}
              className="flex min-h-11 items-center text-xs text-muted-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              필터 지우기
            </button>
          )}
        </div>

        {on && (
          <p className="text-xs text-muted-foreground">{breed}와 함께 쓴 후기만 보고 있어요</p>
        )}
      </div>

      {reviews.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="px-5 py-4">
              <ReviewCard
                review={review}
                // 사진 모음 화면은 PHOTO_REVIEWS(사진이 있는 후기만)를 순서 그대로 받아
                // 그 배열 안 위치로 후기를 가리킨다. 이 목록은 정렬·맞춤보기로 순서가
                // 바뀌어 있어 review 자체의 위치를 못 쓰고, id로 PHOTO_REVIEWS 안
                // 자리를 다시 찾아야 한다
                onPhotoClick={
                  review.photoCount > 0
                    ? (photoIndex) => {
                        const reviewIndex = PHOTO_REVIEWS.findIndex((r) => r.id === review.id);
                        router.push(
                          `/products/${productId}/photos?review=${reviewIndex}&photo=${photoIndex}`,
                        );
                      }
                    : undefined
                }
              />
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
