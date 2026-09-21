// 주문 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getOrders, type GetOrdersParams } from "./orders";

/**
 * 내 주문을 가져온다.
 *
 * **서버 컴포넌트로 두지 않는 이유는 토큰이다.** 토큰이 클라이언트 저장소에 있어 서버에서
 * `Authorization`을 붙일 수 없고, 사람마다 내용이 달라 캐시할 것도 아니다 (AGENTS.md 5.2).
 *
 * **커서 페이지네이션이라 이어 부른다.** 한 번에 오는 것은 기본 10건이라 그것만 그리면
 * 열한 번째 주문부터는 볼 길이 없다. `nextCursor`는 백엔드가
 * `Base64(orderedAt + ":::" + orderId)`로 만든 값이라 받은 그대로 다시 보낸다 (#288).
 */
export function useQueryOrders({ size }: Pick<GetOrdersParams, "size"> = {}) {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.order.list(size),
    queryFn: ({ pageParam }) => getOrders({ size, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage, _pages, lastCursor) => {
      // `hasNext`와 `nextCursor`를 함께 본다. 커서 없이 `hasNext`만 참이면 멈춘다
      if (!lastPage.hasNext || !lastPage.nextCursor) {
        return null;
      }
      // **방금 보낸 커서가 그대로 돌아오면 멈춘다.** 그대로 두면 같은 쪽을 끝없이 부르며
      // 같은 주문이 목록에 계속 쌓인다 (#294 리뷰)
      if (lastPage.nextCursor === lastCursor) {
        return null;
      }
      return lastPage.nextCursor;
    },
  });

  return {
    orders: query.data?.pages.flatMap((page) => page.orders),
    error: query.error,
    isLoading: query.isPending,
    hasNext: query.hasNextPage,
    loadNext: query.fetchNextPage,
    isLoadingNext: query.isFetchingNextPage,
    /** 다음 쪽만 실패한 경우. 첫 조회 실패(`error`)와 달리 이미 받은 주문은 그대로 둔다 */
    nextError: query.isFetchNextPageError,
  };
}
