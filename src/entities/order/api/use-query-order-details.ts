// 주문 여러 건의 상세를 함께 가져오는 훅. 화면은 `useQueries`를 직접 부르지 않는다 (code-convention "훅").
//
// **취소·반품·교환 탭이 쓴다.** 신청 건을 모아 주는 API가 없어(2026-09-23 백엔드 답 — "상세 조회
// 응답에 포함되는 정보를 활용") 주문마다 상세를 받아 `items[].claims`를 모은다 (#462).

import { useQueries } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getOrderDetail } from "./orders";

/**
 * 주어진 주문들의 상세를 가져온다.
 *
 * **상세 화면과 같은 캐시를 쓴다.** 라우트가 주문 번호를 문자열로 넘겨 키에 문자열이 들어가므로
 * 여기서도 문자열로 맞춘다. 숫자로 두면 같은 주문을 두 번 받는다.
 *
 * **처음 받기 실패만 실패로 센다.** TanStack은 다시 받기가 실패해도 받아 둔 상세를 둔 채 오류
 * 상태가 된다. 그것까지 실패로 넘기면 부르는 화면이 보이던 건을 치우고 오류로 덮는다(#474).
 * 배경에서 다시 받다 실패한 것은 받아 둔 것을 그대로 쓴다 (app-message-convention).
 */
export function useQueryOrderDetails(orderIds: number[]) {
  return useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: QUERY_KEYS.order.detail(String(orderId)),
      queryFn: () => getOrderDetail(orderId),
    })),
    combine: (results) => {
      const failed = results.filter((result) => result.isLoadingError);
      return {
        /** 받아 둔 상세. 아직 오지 않았거나 처음 받기에 실패한 주문은 빠진다 */
        details: results.flatMap((result) => (result.data ? [result.data] : [])),
        /** 하나라도 처음 받는 중이면 참이다. 처음 받기에 실패한 것은 대기가 아니라 실패로 센다 */
        isLoading: results.some((result) => result.isPending),
        /** 한 번도 받지 못한 상세 수. 다시 받다 실패한 것(받아 둔 것이 있다)은 세지 않는다 */
        failedCount: failed.length,
        /** 한 번도 받지 못한 것 중 먼저 실패한 것. 없으면 `null`이다 */
        error: failed[0]?.error ?? null,
        /** 한 번도 받지 못한 상세만 다시 받는다 */
        retry: () => {
          for (const result of failed) {
            void result.refetch();
          }
        },
        /** 받지 못한 상세를 다시 받는 중. 다시 시도 버튼의 대기 표시가 본다 */
        isRetrying: failed.some((result) => result.isFetching),
      };
    },
  });
}
