// 결제 승인을 브라우저에서 정확히 한 번 부른다.

"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { confirmPayment } from "./payment";

/** 토스가 복귀 쿼리에 실어 보낸 값들 */
type ConfirmParams = {
  paymentKey: string | undefined;
  /** 토스가 `orderId`로 붙이는 문자열 주문번호 (`ORD-…`) */
  tossOrderId: string | undefined;
  amount: number;
};

/**
 * 승인을 부르고 결과를 준다.
 *
 * **서버 컴포넌트에서 부를 수 없다.** `accessToken`이 브라우저 메모리에만 있어 서버 렌더에서는
 * `Authorization`이 붙지 않고, 백엔드 `confirmPayment(@MemberId …)`가 회원을 못 찾아 막는다.
 * 서버용 주소(`API_BASE_URL_INTERNAL`)도 설정돼 있지 않아 `apiRequest`가 그 앞에서 던진다 (#308).
 *
 * **두 번 보내면 안 된다.** 같은 결제를 두 번 승인하려 들면 토스가 거절하고 사용자에게는
 * 실패로 보인다. `useQuery`가 같은 키의 동시 요청을 하나로 합쳐 StrictMode 이중 마운트를 막고,
 * `staleTime: Infinity`와 `retry: false`가 다시 부르는 길을 닫는다.
 *
 * **실패해도 다시 시도하지 않는다.** 여기까지 왔다는 것은 결제창에서 성공했다는 뜻이라 이미
 * 돈이 빠져나갔을 수 있다. 자동 재시도는 두 번 결제로 이어질 여지를 만든다.
 */
export function useQueryPaymentConfirm({ paymentKey, tossOrderId, amount }: ConfirmParams) {
  // 셋이 다 있고 금액이 숫자일 때만 부른다. 주소창으로 직접 들어온 경우가 걸러진다
  const canConfirm = Boolean(paymentKey) && Boolean(tossOrderId) && Number.isFinite(amount);

  const query = useQuery({
    queryKey: QUERY_KEYS.payment.confirm(paymentKey ?? ""),
    // `enabled`가 꺼져 있으면 부르지 않는다. 빈 문자열이 서버에 나갈 일은 없다
    queryFn: () =>
      confirmPayment({ paymentKey: paymentKey ?? "", orderId: tossOrderId ?? "", amount }),
    enabled: canConfirm,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    // **`retry: false`만으로는 모자라다.** 실패한 쿼리는 데이터가 없어 `staleTime`이
    // 무한이어도 stale로 남는다. 기본값대로면 다시 마운트될 때, 창으로 돌아올 때,
    // 네트워크가 붙을 때 저절로 한 번 더 나간다 — 결제 승인에서 그것은 두 번 결제로
    // 이어질 수 있는 길이다 (#308 리뷰)
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    payment: query.data,
    error: query.error,
    // `enabled`가 꺼져 있으면 `isPending`이 계속 참이다. 그대로 내보내면 대기 표시가 영영 남는다
    isConfirming: canConfirm && query.isPending,
    /** 승인을 부를 수 있는 주소로 들어왔는지. 아니면 결제를 마치고 온 것이 아니다 */
    canConfirm,
  };
}
