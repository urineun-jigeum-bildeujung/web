// 타임딜 알림을 구독 중인지. 메인과 타임딜 화면의 "오픈 알림" 버튼이 같은 값을 본다.

import { useQuery } from "@tanstack/react-query";

import { useHasSession } from "@/shared/api/use-has-session";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getTimeDealSubscription } from "./subscriptions";

/** 로그인하지 않았으면 묻지 않는다. 그동안 `subscribed`는 거짓이다 */
export function useQueryTimeDealSubscription() {
  const enabled = useHasSession();
  const query = useQuery({
    queryKey: QUERY_KEYS.notification.subscription("TIME_DEAL"),
    queryFn: getTimeDealSubscription,
    enabled,
  });
  return { subscribed: query.data ?? false };
}
