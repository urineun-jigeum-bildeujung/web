// 리뷰 탭 상단에 거는 대표 사진을 가져오는 훅.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getFeaturedReviewPhotos } from "./reviews";

/**
 * 상품의 대표 후기 사진을 가져온다.
 *
 * **현재 백엔드 구현은 후기당 한 장씩 최대 넉 장을 준다.** 시안의 썸네일 네 칸과 맞아 화면에서 자르지 않는다.
 */
export function useQueryFeaturedReviewPhotos(productId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.featuredPhotos(productId),
    queryFn: () => getFeaturedReviewPhotos(productId),
  });

  return {
    photos: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
