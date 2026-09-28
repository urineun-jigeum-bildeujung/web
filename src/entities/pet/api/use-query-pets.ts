// 내 아이 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getPets } from "./pets";

type UseQueryPetsOptions = {
  /**
   * 거짓이면 부르지 않는다. 로그인하지 않아도 열리는 화면(메인·맞춤 추천)이 세션으로 건다 —
   * 부르면 401만 남는다(#470)
   */
  enabled?: boolean;
};

/**
 * 로그인한 보호자의 아이 목록을 가져온다. 기본 아이가 앞에 온다.
 *
 * 아이가 하나도 없으면 빈 배열이다 — 실패가 아니라 아직 등록하지 않은 상태이므로
 * 부르는 화면이 온보딩으로 보내는 자리를 보인다.
 */
export function useQueryPets({ enabled = true }: UseQueryPetsOptions = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.pet.list(),
    queryFn: getPets,
    enabled,
  });

  return {
    // **꺼 두면 받아 둔 것도 내주지 않는다.** 재발급 실패로 세션이 끊기면 캐시가 남아, 로그아웃
    // 상태에서도 옛 아이 이름이 보일 수 있다(#470 리뷰)
    pets: enabled ? query.data : undefined,
    /** 처음 받는 중. 부르지 않는 동안은 거짓이다 — 꺼 둔 조회는 끝나지 않는 대기로 남기 때문이다 */
    isLoading: enabled && query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
