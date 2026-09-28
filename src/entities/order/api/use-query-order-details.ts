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
 */
export function useQueryOrderDetails(orderIds: number[]) {
  return useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: QUERY_KEYS.order.detail(String(orderId)),
      queryFn: () => getOrderDetail(orderId),
    })),
    combine: (results) => ({
      /** 받아 온 상세. 아직 오지 않았거나 실패한 주문은 빠진다 */
      details: results.flatMap((result) => (result.data ? [result.data] : [])),
      /** 하나라도 처음 받는 중이면 참이다 */
      isLoading: results.some((result) => result.isPending),
      /** 먼저 실패한 것 하나. 없으면 `null`이다 */
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });
}
