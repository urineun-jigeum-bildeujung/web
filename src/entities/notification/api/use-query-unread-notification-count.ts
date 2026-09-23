// 읽지 않은 알림 수. 헤더 종의 점이 본다. 알림 목록과 같은 캐시를 써 읽으면 바로 줄어든다.

import { useQuery } from "@tanstack/react-query";

import { useHasSession } from "@/shared/api/use-has-session";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getNotifications } from "./notifications";

const PAGE_SIZE = 50;

export function useQueryUnreadNotificationCount(): number {
  const enabled = useHasSession();
  const query = useQuery({
    queryKey: QUERY_KEYS.notification.list(),
    queryFn: () => getNotifications({ page: 0, size: PAGE_SIZE }),
    enabled,
    select: (items) => items.filter((item) => !item.isRead).length,
  });
  return query.data ?? 0;
}
