// 상품 상세의 리뷰 탭. 별점 요약과 후기 목록을 담는다.
// UI 시안(1716:34322)의 리뷰 탭 구성에 맞춘다.
//
// AI 리뷰 요약 카드(#152)는 진행하지 않기로 결정했다(2026-09-17).
// 이 화면의 시안에 그 카드가 보여도 만들지 않는다.
//
// **필터 시트와 맞춤보기 토글을 아직 걸지 않는다(#339).** 서버가 받는 모양과 화면이 고르는
// 모양이 달라서다 — 나이·사용 기간은 서버가 단계 열거형으로 받는데 화면은 구간으로 고르고,
// 품종은 서버가 하나만 받는데 화면은 여럿 고른다. 되는 조건만 보내면 고른 것이 조용히
// 무시되고, 그냥 두면 눌러도 목록이 안 바뀌는 버튼이 된다. 맞춤보기는 서버가 종과 체구만
// 견주어 문구가 약속하는 범위와 달라 함께 닫아 둔다. 코드는 지우지 않고 남겨 뒀다.

"use client";

import Image from "next/image";
import Link from "next/link";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import {
  REVIEW_SORTS,
  REVIEW_SORT_LABEL,
  ReviewCard,
  useQueryFeaturedReviewPhotos,
  useQueryProductReviews,
  type ReviewSort,
} from "@/entities/review";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { useLoadMore } from "@/shared/lib/list/use-load-more";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { Rating } from "@/shared/ui/rating/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

type ReviewPanelProps = {
  productId: string;
};

/** 처음 그릴 때 자리를 잡는다. 카드 두 장이면 탭 높이가 무너지지 않는다 */
function ReviewSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: count }, (_, key) => (
        <div key={key} className="flex flex-col gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10.5 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ReviewPanel({ productId }: ReviewPanelProps) {
  // 정렬은 같은 목록을 다시 세우는 것이라 히스토리에 쌓지 않는다.
  // 쌓으면 뒤로가기를 여러 번 눌러야 화면을 떠난다
  const [sort, setSort] = useQueryState(
    "reviewSort",
    parseAsStringLiteral(REVIEW_SORTS).withDefault("recommend"),
  );

  const {
    reviews,
    averageRating,
    totalCount,
    error,
    isLoading,
    hasNext,
    loadNext,
    isLoadingNext,
    nextError,
  } = useQueryProductReviews({ productId, sort });
  const { photos: featuredPhotos } = useQueryFeaturedReviewPhotos(productId);

  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다 —
  // 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  const list = reviews ?? [];
  // 상단 요약과 같은 기준이다. 값이 0으로 오는지 null로 오는지에 흔들리지 않게 후기 수를 본다
  const hasRating = totalCount !== null && totalCount > 0 && averageRating !== null;

  return (
    <div className="flex flex-col">
      <section aria-label="별점 요약" className="flex flex-col items-start gap-1 p-5">
        {/* 평가가 없으면 빈 별 다섯만 두고 숫자를 적지 않는다 — `Rating`은 빈 별을 이미
            회색(icon/fill/disable)으로 그린다 */}
        <Rating
          value={hasRating ? averageRating : 0}
          size="lg"
          showValue={hasRating}
          // 화면에서 숫자를 감춰도 `Rating`은 낭독기에 "0점"을 읽는다. 후기가 없는 상품이
          // 낮은 평가를 받은 상품으로 들리지 않게 문구째로 바꾼다
          srLabel={hasRating ? undefined : "아직 평가가 없어요"}
        />
        {totalCount === null ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <p className="text-body-medium-14 text-text-body-secondary">총 리뷰 {totalCount}개</p>
        )}
      </section>

      <div className="h-2 bg-muted" />

      {featuredPhotos && featuredPhotos.length > 0 && (
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

          {/* 현재 백엔드 구현이 후기당 대표 한 장씩 넉 장을 준다. 화면에서 자르지 않는다.
              4열 정사각 그리드라 393px보다 좁은 화면에서도 폭을 넘지 않는다 */}
          <ul className="grid grid-cols-4 gap-1">
            {featuredPhotos.map((photo) => (
              <li key={photo.reviewId}>
                {/* 현재 백엔드 구현은 `sortOrder = 0`인 사진을 대표로 돌려주고 상세 응답도
                    `sortOrder` 오름차순이라, `n=0`이 같은 사진을 가리킨다. 정식 계약은 아니라
                    `photoId`·`imageIndex`를 요청해 둔 상태다 */}
                <Link
                  href={`/products/${productId}/photos?photo=${photo.reviewId}&n=0`}
                  aria-label="이 후기의 첫 사진 크게 보기"
                  className="relative block aspect-square w-full overflow-hidden rounded-lg bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Image
                    src={photo.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 180px, 25vw"
                    className="object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="h-2 bg-muted" />

      <div className="flex items-center justify-end border-b border-border p-4">
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

      {isLoading && <ReviewSkeleton />}

      {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다.
          **이미 받아 둔 후기가 있으면 화면을 덮지 않는다** — 둘째 쪽에서 실패했다고 보고 있던
          목록까지 사라지면 읽던 자리를 잃는다 */}
      {error && list.length === 0 && (
        <EmptyState role="alert" className="py-10" {...APP_MESSAGE[toAppMessageCode(error)]} />
      )}

      {!isLoading && !error && list.length === 0 && (
        <EmptyState
          title="아직 후기가 없어요"
          description="먹여 보고 첫 후기를 남겨 주세요."
          className="py-10"
        />
      )}

      {list.length > 0 && (
        <>
          <ul className="flex flex-col divide-y divide-border">
            {list.map((review) => (
              <li key={review.id} className="px-5 py-4">
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
          {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다 */}
          {hasNext && !nextError && <div ref={loadMoreRef} aria-hidden className="h-px" />}
          {isLoadingNext && <ReviewSkeleton count={1} />}

          {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다.
              **다시 받는 동안에도 오류 상태가 남아 이 버튼이 서 있다.** 잠그지 않으면 또 눌러
              같은 쪽으로 요청이 한 번 더 나간다 (주문 목록과 같은 처리, #427) */}
          {nextError && (
            <Button
              variant="secondary"
              className="mx-5 my-4 h-10 text-label-bold-14"
              disabled={isLoadingNext}
              onClick={() => loadNext()}
            >
              <LoadingSwap loading={isLoadingNext} label="후기를 더 불러오는 중">
                후기를 더 불러오지 못했어요. 다시 시도
              </LoadingSwap>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
