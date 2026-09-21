// 반품·교환을 접수하는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").
//
// **낙관적 갱신을 쓰지 않는다.** 접수하면 기사가 물건을 가지러 오는 되돌리기 어려운 동작이라,
// 서버가 받았다고 답한 뒤에 화면을 옮긴다 (AGENTS.md 5.8).
//
// **실패 알림은 여기서 하지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경
// 실패를 토스트로 알린다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { createClaim, type CreateClaimRequest } from "./claims";

export function useMutateClaim(orderId: number) {
  const queryClient = useQueryClient();

  // 함수를 그대로 넘기지 않고 감싼다. 직접 넘기면 이 훅이 평가될 때의 바인딩이 굳어,
  // 테스트가 모듈을 갈아끼워도 옛 함수가 불린다 (`use-mutate-order`도 같은 이유로 감싼다).
  const mutation = useMutation({
    mutationFn: (request: CreateClaimRequest) => createClaim(orderId, request),
    // 접수되면 상품 줄의 `claims[]`가 달라진다. 목록의 상태 뱃지도 함께 움직일 수 있다
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order.all }),
  });

  return {
    request: mutation.mutateAsync,
    isRequesting: mutation.isPending,
  };
}
