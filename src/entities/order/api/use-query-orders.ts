// 주문 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getOrders, type GetOrdersParams } from "./orders";

/**
 * 내 주문을 가져온다.
 *
 * **서버 컴포넌트로 두지 않는 이유는 토큰이다.** 토큰이 클라이언트 저장소에 있어 서버에서
 * `Authorization`을 붙일 수 없고, 사람마다 내용이 달라 캐시할 것도 아니다 (AGENTS.md 5.2).
 *
 * **첫 쪽만 부른다.** 응답이 `nextCursor`·`hasNext`로 다음 쪽을 알려 주지만 명세 Example이
 * 한 쪽짜리뿐이라 이어 부르는 동작을 확인하지 못했다. 다음 쪽은 뮤테이션 작업과 함께 본다.
 */
export function useQueryOrders({ size }: Pick<GetOrdersParams, "size"> = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.order.list(size),
    queryFn: () => getOrders({ size }),
  });

  return {
    orders: query.data?.orders,
    hasNext: query.data?.hasNext ?? false,
    error: query.error,
    isLoading: query.isPending,
  };
}
