// 반응을 남길 수 있는 구매 항목을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getPendingFeedbacks } from "./feedbacks";

type UseQueryPendingFeedbacksOptions = {
  /** 로그인 없이 열리는 메인이 로그인했을 때만 켠다(#494). 마이페이지는 늘 로그인이라 기본값을 쓴다 */
  enabled?: boolean;
};

export function useQueryPendingFeedbacks({ enabled = true }: UseQueryPendingFeedbacksOptions = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.feedbackPending(),
    queryFn: getPendingFeedbacks,
    enabled,
  });

  return {
    // **꺼 두면 받아 둔 것도 내주지 않는다.** 재발급 실패로 세션이 끊기면 캐시가 남아, 로그아웃
    // 상태에서도 전의 구매 항목이 보일 수 있다 — `useQueryPets`와 같다
    items: enabled ? query.data : undefined,
    /** 처음 받는 중. 부르지 않는 동안은 거짓이다 — 꺼 둔 조회는 끝나지 않는 대기로 남기 때문이다 */
    isLoading: enabled && query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
