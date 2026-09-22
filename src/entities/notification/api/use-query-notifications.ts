// 내 알림 목록을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getNotifications } from "./notifications";

/** 첫 쪽만 받는다. 화면에 더보기가 없어 한 화면에 넉넉한 만큼 받는다. 응답에 `hasNext`가 없다 */
const PAGE_SIZE = 50;

export function useQueryNotifications() {
  const query = useQuery({
    queryKey: QUERY_KEYS.notification.list(),
    queryFn: () => getNotifications({ page: 0, size: PAGE_SIZE }),
  });

  return {
    items: query.data,
    isLoading: query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
