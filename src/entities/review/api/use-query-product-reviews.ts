// 상품 후기 목록을 쪽 단위로 이어 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { ReviewSort } from "../model/review-sort";

import { getProductReviews, type ProductReviewConditions } from "./reviews";

/** 한 쪽에 받는 후기 수. 백엔드 기본값과 같다 */
const PAGE_SIZE = 10;

/**
 * 상품 후기를 가져온다.
 *
 * **응답에 `hasNext`가 없다.** 사진 목록에는 있는데 후기 목록에는 `totalCount`만 온다.
 * 지금까지 받은 개수가 그 값에 닿으면 멈춘다.
 */
export function useQueryProductReviews({
  productId,
  sort,
  conditions,
}: {
  productId: string;
  sort: ReviewSort;
  /** 거르기 조건(#472). 바뀌면 첫 쪽부터 다시 받는다 */
  conditions?: ProductReviewConditions;
}) {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.review.byProduct(productId, { sort, conditions }),
    queryFn: ({ pageParam }) =>
      getProductReviews({ productId, sort, page: pageParam, size: PAGE_SIZE, conditions }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      // 빈 쪽이 오면 더 불러도 같은 답이다. `totalCount`만 믿으면 끝없이 부를 수 있다
      if (lastPage.reviews.length === 0) {
        return null;
      }
      const loaded = pages.reduce((sum, page) => sum + page.reviews.length, 0);
      return loaded < lastPage.totalCount ? pages.length : null;
    },
  });

  // 요약값은 쪽마다 같아 첫 쪽에서 꺼낸다. 아직 한 쪽도 못 받았으면 화면이 자리를 비운다
  const summary = query.data?.pages[0];

  return {
    reviews: query.data?.pages.flatMap((page) => page.reviews),
    /** 이 상품 전체 평균. 아직 받지 못했으면 `null` */
    averageRating: summary?.averageRating ?? null,
    totalCount: summary?.totalCount ?? null,
    error: query.error,
    isLoading: query.isPending,
    hasNext: query.hasNextPage,
    loadNext: query.fetchNextPage,
    isLoadingNext: query.isFetchingNextPage,
    /** 다음 쪽만 실패한 경우. 첫 조회 실패(`error`)와 달리 이미 받은 후기는 그대로 둔다 */
    nextError: query.isFetchNextPageError,
  };
}
