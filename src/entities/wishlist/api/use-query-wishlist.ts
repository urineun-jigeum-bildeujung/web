// 찜 목록을 가져오는 훅. 화면은 useQuery를 직접 부르지 않는다(code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getWishlist } from "./wishlist";

/**
 * 찜 목록을 가져온다. `categoryCode`를 생략하면 전체를 받는다.
 *
 * **`options.enabled`가 필요한 이유는 빈 상태 구분이다.** 찜 응답엔 상품의 카테고리가
 * 없어 카테고리별 조회 하나만으로는 "찜 전체가 비었음"과 "고른 카테고리에만 없음"을
 * 가를 수 없다(#390). 그래서 화면은 이 훅을 두 번 부른다 — 전체 조회(비었는지 확인용)는
 * 항상 켜 두고, 카테고리 조회는 `all`이 아닐 때만 `enabled`로 켠다. 같은 요청을 두 번
 * 보내지 않기 위해서다.
 */
export function useQueryWishlist(categoryCode?: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: QUERY_KEYS.user.likes(categoryCode),
    queryFn: () => getWishlist(categoryCode),
    enabled: options?.enabled,
  });

  return {
    items: query.data,
    error: query.error,
    isLoading: query.isPending,
    /** 다시 시도 버튼의 대기 표시(LoadingSwap)용. 첫 로딩(isLoading)과는 다르다 */
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
