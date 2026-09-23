// 열려 있는 동안 새로 온 알림을 토스트로 알린다. 그리는 것은 없다.
//
// 앱(웹뷰)은 Push API가 없어 FCM을 못 받는다. 30초마다 알림 목록을 다시 받아 지난번보다 새 알림이
// 있으면 알린다(#395). 처음 받은 목록은 알리지 않는다 — 들어오자마자 옛 알림이 쏟아지면 안 된다.
// 토스트는 설정의 알림 스위치가 켜져 있을 때만 띄운다(#403). 폴링은 스위치와 무관하게 돌아 종의 점과
// 알림함은 늘 갱신되고, 기준 id도 계속 옮겨 둔다 — 스위치를 켜는 순간 그동안 쌓인 것이 쏟아지면 안 된다.
// 탭이 숨겨진 동안은 폴링이 쉬고, 돌아오면 TanStack이 창 포커스에 다시 받아 그동안 온 것을 그때 알린다.
// FCM 웹 푸시를 켠 브라우저는 숨긴 동안 OS 알림이 먼저 뜨지만, 토스트는 돌아온 뒤 한 번만 뜬다.
// 종의 점과 알림함이 같은 캐시를 쓰므로 여기서 받은 목록이 그쪽에도 그대로 보인다.

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { useQueryNotifications, type AppNotification } from "@/entities/notification";
import { toastPushMessage } from "@/shared/lib/app-toast";
import { readPushEnabled, subscribePushPreference } from "@/shared/lib/push/push-preference";

/** 화면이 보이는 동안 이 간격으로 묻는다. 서버 부담은 작고 알림은 늦어도 이만큼 뒤에 뜬다 */
const POLLING_INTERVAL_MS = 30_000;
/** 한꺼번에 여러 개가 오면 최신 몇 개만 알린다. 나머지는 종의 점과 알림함이 맡는다 */
const MAX_TOASTS = 3;

function maxId(items: AppNotification[]): number {
  return items.reduce((max, item) => Math.max(max, Number(item.id)), 0);
}

export function NewNotificationToaster() {
  const { items } = useQueryNotifications({ pollingInterval: POLLING_INTERVAL_MS });
  // 서버 렌더에서는 늘 꺼짐. 클라이언트가 저장된 표시를 읽어 바꾼다
  const enabled = useSyncExternalStore(subscribePushPreference, readPushEnabled, () => false);
  // 지난번 목록의 가장 큰 id. `null`이면 아직 한 번도 못 받은 것이다
  const seenMaxId = useRef<number | null>(null);

  useEffect(() => {
    if (!items) return;
    const latest = maxId(items);
    if (seenMaxId.current === null) {
      seenMaxId.current = latest;
      return;
    }
    const seen = seenMaxId.current;
    seenMaxId.current = Math.max(seen, latest);
    if (!enabled) return;
    const fresh = items
      .filter((item) => Number(item.id) > seen)
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, MAX_TOASTS);
    for (const item of fresh) toastPushMessage(item.title, item.body);
  }, [items, enabled]);

  return null;
}
