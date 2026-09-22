// 구매확정했는데 아직 후기를 안 쓴 상품 목록을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getWritableReviews } from "./reviews";

/** 후기를 등록하면 `useMutateCreateReview`가 `myAll` 키를 비워 이 목록도 함께 새로 받는다 */
export function useQueryWritableReviews() {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.myWritable(),
    queryFn: getWritableReviews,
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
