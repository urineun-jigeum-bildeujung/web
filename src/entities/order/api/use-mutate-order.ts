// 주문 상태를 바꾸는 훅. 구매 확정과 주문 취소가 같은 캐시를 건드려 한 자리에 둔다.
//
// **실패 알림은 여기서 하지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경 실패를
// 토스트로 알리고 있어, 여기서 또 띄우면 같은 실패가 두 번 뜬다.
//
// **낙관적 갱신을 쓰지 않는다.** 장바구니 수량처럼 연달아 누르는 조작이 아니라 한 번 누르면
// 되돌릴 수 없는 동작이다. 먼저 그려 놓고 서버가 거절하면 확정된 줄 알았던 주문이 되살아나
// 무엇이 참인지 알 수 없게 된다. 서버가 끝낸 뒤 목록을 다시 받아 맞춘다 (AGENTS.md 5.8).

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { cancelOrder, confirmOrder } from "./orders";

export function useMutateOrder() {
  const queryClient = useQueryClient();

  // 목록과 상세가 같은 주문을 들고 있어 둘 다 무효로 만든다.
  const settle = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order.all });

  // 함수를 그대로 넘기지 않고 감싼다. 직접 넘기면 이 훅이 평가될 때의 바인딩이 굳어,
  // 테스트가 모듈을 갈아끼워도 옛 함수가 불린다 (`use-mutate-cart-item`도 같은 이유로 감싼다).
  const confirmation = useMutation({
    mutationFn: (orderId: number) => confirmOrder(orderId),
    // **구매 확정이 리뷰를 쓸 자격을 연다.** 서버가 작성할 수 있는 리뷰 목록을 확정된 주문으로
    // 만든다(`findConfirmedPurchaseItems`). 받아 둔 목록을 그대로 두면 60초 동안 방금 확정한
    // 상품이 빠져 보인다 (#416)
    onSettled: () =>
      Promise.all([
        settle(),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.myWritable() }),
      ]),
  });

  const cancellation = useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSettled: settle,
  });

  return {
    confirm: confirmation.mutateAsync,
    cancel: cancellation.mutateAsync,
    /** 확정을 기다리는 주문. 버튼이 자리를 지킨 채 대기를 보이게 한다 */
    confirmingId: confirmation.isPending ? confirmation.variables : null,
    cancelingId: cancellation.isPending ? cancellation.variables : null,
  };
}
