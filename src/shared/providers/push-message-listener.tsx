"use client";
// 탭이 보이는 동안 도착한 푸시를 받아 알림 목록 캐시를 비운다.
//
// 서비스 워커는 보이는 탭이 있으면 알림을 띄우지 않고 페이지로 넘긴다(Firebase SDK 동작). 그래서
// 앱 전역에 하나 두고, 설정에서 푸시를 켠 기기에서만 구독한다. 화면마다 두면 빠뜨린 곳이 생긴다.
// 앱(웹뷰) 안에서는 앱이 열려 있을 때 받은 푸시를 `push-received` 신호로 넘겨 준다(#403). 같은 일을 한다.
// 토스트는 여기서 띄우지 않는다 — 캐시를 비우면 `widgets/notification-bell`의 폴링 토스터가 새 알림을
// 보고 한 번만 알린다(#395). 여기서도 띄우면 두 번 뜬다.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { reportError } from "@/shared/lib/report-error";
import { subscribePushMessages } from "@/shared/lib/push/fcm";
import { subscribeNativePushReceived } from "@/shared/lib/push/native-bridge";
import { readPushEnabled, subscribePushPreference } from "@/shared/lib/push/push-preference";

export function PushMessageListener() {
  const queryClient = useQueryClient();
  // 서버 렌더에서는 늘 꺼짐. 클라이언트가 저장된 표시와 권한을 읽어 바꾼다
  const enabled = useSyncExternalStore(subscribePushPreference, readPushEnabled, () => false);

  useEffect(() => {
    // 새 알림이 왔으니 알림함이 다시 받아야 한다. 토스트는 그 결과를 본 폴링 토스터가 띄운다
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
    };
    // 앱 신호는 스위치와 무관하게 듣는다. 앱 토큰은 스위치를 꺼도 서버에 남아 신호가 계속 오는데,
    // 그때도 종의 점과 알림함은 최신이어야 한다. 토스트 여부는 토스터가 스위치를 보고 정한다
    const unsubscribeNative = subscribeNativePushReceived(refresh);
    if (!enabled) return unsubscribeNative;

    // 구독이 비동기로 걸리므로, 걸리기 전에 꺼지면 걸린 직후 바로 끊는다
    let cancelled = false;
    let unsubscribe = () => {};
    void subscribePushMessages(refresh)
      .then((off) => {
        if (cancelled) off();
        else unsubscribe = off;
      })
      // firebase 모듈을 못 받았거나 초기화가 깨진 것이다. 사용자가 한 일이 없어 토스트는 띄우지 않고 남긴다
      .catch((error: unknown) => reportError("push.subscribe", error));

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeNative();
    };
  }, [enabled, queryClient]);

  return null;
}
