// 주문 하나를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getOrderDetail } from "./orders";

/**
 * 주문 상세를 가져온다.
 *
 * **`orderId`는 라우트에서 문자열로 온다.** `/mypage/orders/abc`처럼 숫자가 아닌 주소로도
 * 들어올 수 있어, 그때는 서버를 부르지 않고 없는 주문으로 다룬다. 400을 받으려고 한 번
 * 다녀오는 것보다 낫다.
 */
export function useQueryOrderDetail(orderId: string) {
  const numericId = Number(orderId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const query = useQuery({
    queryKey: QUERY_KEYS.order.detail(orderId),
    queryFn: () => getOrderDetail(numericId),
    enabled: isValidId,
  });

  return {
    order: query.data,
    error: query.error,
    // `enabled`가 꺼져 있으면 `isPending`은 계속 참이다. 그대로 내보내면 뼈대가 영영 남는다
    isLoading: isValidId && query.isPending,
    /** 받아 오는 중인지. 받아 둔 것을 뒤에서 다시 받는 중에도 참이다 (#419 리뷰) */
    isFetching: query.isFetching,
  };
}
