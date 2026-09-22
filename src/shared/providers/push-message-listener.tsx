"use client";
// 탭이 보이는 동안 도착한 푸시를 토스트로 알리고 알림 목록 캐시를 비운다.
//
// 서비스 워커는 보이는 탭이 있으면 알림을 띄우지 않고 페이지로 넘긴다(Firebase SDK 동작). 그래서
// 앱 전역에 하나 두고, 설정에서 푸시를 켠 기기에서만 구독한다. 화면마다 두면 빠뜨린 곳이 생긴다.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { toastPushMessage } from "@/shared/lib/app-toast";
import { subscribePushMessages } from "@/shared/lib/push/fcm";
import { readPushEnabled, subscribePushPreference } from "@/shared/lib/push/push-preference";

export function PushMessageListener() {
  const queryClient = useQueryClient();
  // 서버 렌더에서는 늘 꺼짐. 클라이언트가 저장된 표시와 권한을 읽어 바꾼다
  const enabled = useSyncExternalStore(subscribePushPreference, readPushEnabled, () => false);

  useEffect(() => {
    if (!enabled) return;

    // 구독이 비동기로 걸리므로, 걸리기 전에 꺼지면 걸린 직후 바로 끊는다
    let cancelled = false;
    let unsubscribe = () => {};
    void subscribePushMessages((message) => {
      if (message.title) toastPushMessage(message.title, message.body);
      // 새 알림이 왔으니 알림함이 다시 받아야 한다
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
    }).then((off) => {
      if (cancelled) off();
      else unsubscribe = off;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, queryClient]);

  return null;
}
