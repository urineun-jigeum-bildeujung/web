// 결제 승인이 끝난 뒤 주문 캐시를 낡은 것으로 표시하는 훅. 다음에 여는 주문 화면이 새로 받게 한다.
//
// **완료 화면이 받은 주문 상세는 승인 전 모습이다.** 서버는 승인 뒤 이벤트(outbox → Kafka)를
// 거쳐 결제 완료를 1초 남짓 늦게 적어서, 승인과 같이 보낸 조회에는 결제 대기에 결제 정보 없이
// 온다. 표시하지 않으면 60초 동안 주문 상세가 결제상세와 취소 버튼이 빠진 그 모습을 쓰고,
// 목록은 방금 산 주문을 모른다 (#416).

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { QUERY_KEYS } from "@/shared/config/query-keys";

/**
 * `ready`가 켜지면 주문 캐시(목록·상세)를 낡은 것으로 표시한다.
 *
 * **승인과 주문 조회가 모두 끝난 뒤에 켠다.** 조회가 끝나기 전에 표시하면 뒤이어 도착한 응답이
 * 표시를 지운다.
 *
 * **여기서 다시 받지는 않는다.** 서버가 아직 결제 완료를 적기 전일 수 있어, 지금 받으면 같은 결제
 * 대기 모습이 새것으로 다시 들어앉는다. 다음에 여는 화면이 받게만 한다.
 */
export function useMarkOrdersStale(ready: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order.all, refetchType: "none" });
    }
  }, [ready, queryClient]);
}
