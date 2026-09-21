// 내가 쓴 후기 목록을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getMyReviews } from "./reviews";

/**
 * 첫 쪽만 받는다. 쪽 크기는 목록 화면이 한 번에 보일 만큼이다.
 *
 * **`hasNext`를 화면이 아직 안 쓰더라도 내준다.** 더보기를 붙일 때 이 훅을 다시 뜯지 않으려면
 * 처음부터 보존해 둬야 한다. 키(`myList`)에 쪽이 없어 커서 로딩은 그때 키와 함께 넓힌다.
 */
export function useQueryMyReviews() {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.myList(),
    queryFn: () => getMyReviews({ page: 0, size: 20 }),
  });

  return {
    reviews: query.data?.items,
    hasNext: query.data?.hasNext ?? false,
    isLoading: query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
