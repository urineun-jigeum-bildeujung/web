// 알림을 읽음으로 바꾸는 훅. 목록 캐시를 먼저 바꾸고 서버에 알린다.
//
// **낙관적 갱신이다.** 열어 본 순간 "읽지 않음" 점이 사라져야 눌렸다는 것을 안다. 실패하면 되돌리고,
// 끝나면 목록을 다시 받아 서버와 맞춘다. 대기 표시는 두지 않는다(AGENTS.md 5.8).

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { markNotificationRead, type AppNotification } from "./notifications";

export function useMutateReadNotification() {
  const queryClient = useQueryClient();
  const listKey = QUERY_KEYS.notification.list();

  const mutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<AppNotification[]>(listKey);
      queryClient.setQueryData<AppNotification[]>(listKey, (items) =>
        items?.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return {
    markRead: mutation.mutate,
  };
}
