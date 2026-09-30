// 고른 아이의 맞춤 추천을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { skipToken, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getHomeRecommendations } from "./recommendations";
import type { RecommendationCategory } from "../model/recommendation";

type UseQueryHomeRecommendationsOptions = {
  /** 고른 아이. 없으면(로그인 전·아이 없음) 부르지 않는다 */
  petId: number | undefined;
  category?: RecommendationCategory;
  size?: number;
};

/**
 * 맞춤 추천 목록. 서버가 매긴 추천 순서 그대로다.
 *
 * **받아 둔 것 없이 실패하면 오류를 던진다.** 이 훅을 쓰는 칸은 `shared/ui/error-boundary`로 감싸,
 * 추천만 실패하고 같은 화면의 다른 칸은 그대로 남게 한다. 그 경계의 "다시 시도"가 조회를 리셋한다.
 * 이미 그려 둔 목록이 있으면 배경 재조회가 실패해도 던지지 않고 그 목록을 지킨다.
 */
export function useQueryHomeRecommendations({
  petId,
  category,
  size,
}: UseQueryHomeRecommendationsOptions) {
  const enabled = petId !== undefined;
  const query = useQuery({
    // 아이가 없으면 skipToken으로 부르지 않는다. 그동안의 키는 쓰이지 않는 자리 표시다
    queryKey: QUERY_KEYS.recommendation.home({ petId: petId ?? "none", category, size }),
    queryFn: enabled ? () => getHomeRecommendations({ petId, category, size }) : skipToken,
    throwOnError: (_error, { state }) => state.data === undefined,
  });

  return {
    items: enabled ? query.data : undefined,
    /** 처음 받는 중. 부르지 않는 동안은 거짓이다 — 꺼 둔 조회는 끝나지 않는 대기로 남기 때문이다 */
    isLoading: enabled && query.isPending,
  };
}
