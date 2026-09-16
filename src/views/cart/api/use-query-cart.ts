// 장바구니를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getCart } from "./cart";

/**
 * 담아 둔 것을 가져온다.
 *
 * **서버 컴포넌트로 두지 않는 이유는 토큰이다.** 토큰이 클라이언트 저장소에 있어 서버에서
 * `Authorization`을 붙일 수 없고, 사람마다 내용이 달라 캐시할 것도 아니다 (AGENTS.md 5.2).
 */
export function useQueryCart() {
  const query = useQuery({
    queryKey: QUERY_KEYS.cart.list(),
    queryFn: getCart,
  });

  return {
    cart: query.data,
    error: query.error,
    isLoading: query.isPending,
  };
}
