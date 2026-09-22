// 리뷰 한 건의 상세를 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getReviewDetail } from "./reviews";

export function useQueryReviewDetail(reviewId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.detail(reviewId),
    queryFn: () => getReviewDetail(reviewId),
  });

  return {
    review: query.data,
    isLoading: query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
