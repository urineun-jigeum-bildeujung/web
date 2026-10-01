// 타임딜 알림 구독을 켜고 끄는 훅. 서버가 저장한 값으로 구독 캐시를 바꿔 두 화면의 버튼이 함께 바뀐다.
//
// **낙관적 갱신이 아니다.** "신청됨"은 서버에 저장됐다는 약속이라 응답을 받고서 바꾼다. 그동안 버튼은
// `isPending`으로 대기를 알린다(AGENTS.md 5.8). 실패 토스트는 공통 쿼리 클라이언트가 띄운다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { updateTimeDealSubscription } from "./subscriptions";

export function useMutateTimeDealSubscription() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateTimeDealSubscription,
    onSuccess: (subscribed) =>
      queryClient.setQueryData(QUERY_KEYS.notification.subscription("TIME_DEAL"), subscribed),
  });
  return { setSubscribed: mutation.mutate, isPending: mutation.isPending };
}
