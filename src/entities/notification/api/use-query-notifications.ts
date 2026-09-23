// 내 알림 목록을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { useHasSession } from "@/shared/api/use-has-session";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getNotifications } from "./notifications";

/** 첫 쪽만 받는다. 화면에 더보기가 없어 한 화면에 넉넉한 만큼 받는다. 응답에 `hasNext`가 없다 */
const PAGE_SIZE = 50;

type UseQueryNotificationsOptions = {
  /**
   * 이 간격(ms)으로 다시 받는다. 앱(웹뷰)은 푸시를 못 받아 새 알림을 이렇게만 안다(#395).
   * TanStack 기본값대로 문서가 숨겨져 있으면 쉰다(`refetchIntervalInBackground: false`)
   */
  pollingInterval?: number;
};

export function useQueryNotifications({ pollingInterval }: UseQueryNotificationsOptions = {}) {
  // 로그인 전에는 부르지 않는다. 헤더 종처럼 공개 화면에도 있는 부품이 401을 내면 안 된다
  const enabled = useHasSession();
  const query = useQuery({
    queryKey: QUERY_KEYS.notification.list(),
    queryFn: () => getNotifications({ page: 0, size: PAGE_SIZE }),
    enabled,
    refetchInterval: pollingInterval ?? false,
  });

  return {
    items: query.data,
    isLoading: enabled && query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
