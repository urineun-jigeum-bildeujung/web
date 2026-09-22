// 설정의 알림 스위치. 뜻은 "이 기기의 푸시 허용"이다 — 권한 → 토큰 → 서버 등록 → 표시 저장을 여기서 묶는다.
//
// 서버 구독(`subscriptions/{category}`)은 쓰지 않는다. 카테고리가 `TIME_DEAL` 하나라 "알림설정"과
// 뜻이 안 맞는다(#354). 켜짐 판정과 표시 저장은 `shared/lib/push/push-preference`가 맡는다 — 앱 전역의
// 포그라운드 수신기가 같은 값을 본다.

import { useMutation } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { registerFcmToken } from "@/entities/notification";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { deletePushToken, isPushSupported, requestPushToken } from "@/shared/lib/push/fcm";
import {
  readPushEnabled,
  subscribePushPreference,
  writePushEnabled,
} from "@/shared/lib/push/push-preference";

/** 권한이 없어 켜지 못했다. 서버 실패와 다른 문구가 필요해 가른다 */
class PushPermissionError extends Error {
  constructor() {
    super("push permission not granted");
  }
}

export function useMutatePushSetting() {
  // 서버 렌더에서는 늘 꺼짐·지원으로 그리고 클라이언트가 실제 값을 읽는다 — `useState` 초기값으로
  // 읽으면 서버와 첫 렌더가 어긋나 하이드레이션 경고가 난다
  const enabled = useSyncExternalStore(subscribePushPreference, readPushEnabled, () => false);
  const supported = useSyncExternalStore(subscribePushPreference, isPushSupported, () => true);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!next) {
        await deletePushToken();
        return false;
      }
      const result = await requestPushToken();
      if (result.status !== "granted") throw new PushPermissionError();
      await registerFcmToken(result.token);
      return true;
    },
    onSuccess: writePushEnabled,
    onError: (error: unknown) => {
      if (error instanceof PushPermissionError) {
        toastAppError(APP_MESSAGE_CODE.notification.pushPermissionDenied);
        return;
      }
      toastAppError(toAppMessageCode(error), error);
    },
  });

  return {
    enabled,
    /** 이 브라우저에서 푸시를 받을 수 있는가. 아니면 스위치를 잠근다 */
    supported,
    /** 권한을 묻고 서버에 알리는 동안. 스위치 옆 아이콘의 대기 표시가 본다 */
    isChanging: mutation.isPending,
    setPushEnabled: (next: boolean) => mutation.mutate(next),
  };
}
