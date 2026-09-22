// 반응을 남길 수 있는 구매 항목을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getPendingFeedbacks } from "./feedbacks";

export function useQueryPendingFeedbacks() {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.feedbackPending(),
    queryFn: getPendingFeedbacks,
  });

  return {
    items: query.data,
    isLoading: query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
