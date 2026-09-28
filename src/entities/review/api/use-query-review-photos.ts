// 후기 사진을 쪽 단위로 이어 받는 훅. 사진 모음 화면이 격자로 편다.

import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getReviewPhotos } from "./reviews";

/** 한 쪽에 받는 사진 수. 3열 격자라 열 줄이 채워진다 */
const PAGE_SIZE = 30;

/**
 * 상품의 후기 사진을 가져온다.
 *
 * 후기 목록과 달리 **응답에 `hasNext`가 있어** 그대로 쓴다.
 * `totalCount`는 후기 수가 아니라 사진 장수다 — 화면의 "사진이 있는 리뷰 N장"이 이 값이다.
 */
export function useQueryReviewPhotos(productId: string) {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.review.photos(productId),
    queryFn: ({ pageParam }) => getReviewPhotos({ productId, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.hasNext ? pages.length : null),
  });

  return {
    photos: query.data?.pages.flatMap((page) => page.photos),
    /** 사진 장수. 아직 받지 못했으면 `null` */
    totalCount: query.data?.pages[0]?.totalCount ?? null,
    error: query.error,
    isLoading: query.isPending,
    hasNext: query.hasNextPage,
    loadNext: query.fetchNextPage,
    isLoadingNext: query.isFetchingNextPage,
    /** 다음 쪽만 실패한 경우. 이미 받은 사진은 그대로 둔다 */
    nextError: query.isFetchNextPageError,
  };
}
