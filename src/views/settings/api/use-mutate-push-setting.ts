// 설정의 알림 스위치. 뜻은 "이 기기의 푸시 허용"이다 — 권한 → 토큰 → 서버 등록 → 표시 저장을 여기서 묶는다.
//
// 서버 구독(`subscriptions/{category}`)은 쓰지 않는다. 카테고리가 `TIME_DEAL` 하나라 "알림설정"과
// 뜻이 안 맞는다(#354). 켜짐 판정과 표시 저장은 `shared/lib/push/push-preference`가 맡는다 — 앱 전역의
// 포그라운드 수신기가 같은 값을 본다.

import { useMutation } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { registerFcmToken } from "@/entities/notification";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { reportError } from "@/shared/lib/report-error";
import { deletePushToken, isPushSupported, requestPushToken } from "@/shared/lib/push/fcm";
import {
  readPushEnabled,
  subscribePushPreference,
  writePushEnabled,
} from "@/shared/lib/push/push-preference";

/** 스위치 동작의 결과. 권한 거부는 서버 실패가 아니라 던지지 않고 결과로 돌려준다 */
type PushSettingResult = { enabled: boolean } | { denied: true };

/** 저장이 막힌 브라우저다. 서버 실패와 같은 문구("요청 실패")로 알린다 */
class PushPreferenceStorageError extends Error {
  constructor() {
    super("push preference storage unavailable");
  }
}

export function useMutatePushSetting() {
  // 서버 렌더에서는 늘 꺼짐·지원으로 그리고 클라이언트가 실제 값을 읽는다 — `useState` 초기값으로
  // 읽으면 서버와 첫 렌더가 어긋나 하이드레이션 경고가 난다
  const enabled = useSyncExternalStore(subscribePushPreference, readPushEnabled, () => false);
  const supported = useSyncExternalStore(subscribePushPreference, isPushSupported, () => true);

  // 서버 실패 토스트는 AppProviders의 MutationCache가 한 번 띄운다. 여기서 또 띄우지 않는다
  const mutation = useMutation({
    mutationFn: async (next: boolean): Promise<PushSettingResult> => {
      if (!next) {
        // 표시를 먼저 지운다. 지우지 못하면 토큰도 그대로 두어 화면과 기기가 어긋나지 않는다
        if (!writePushEnabled(false)) throw new PushPreferenceStorageError();
        try {
          await deletePushToken();
        } catch (error) {
          // 표시를 되살려 켜짐으로 돌아간다. 그것마저 실패하면 표시는 꺼짐인데 토큰은 살아 있다 —
          // 다음에 켤 때 새 토큰을 등록하고 저장이 또 막히면 토큰을 지우므로 스스로 맞춰진다. 기록만 남긴다
          if (!writePushEnabled(true)) reportError("push.restore", error);
          throw error;
        }
        return { enabled: false };
      }
      const result = await requestPushToken();
      if (result.status !== "granted") return { denied: true };
      await registerFcmToken(result.token);
      // 표시를 못 남기면 서버에만 토큰이 남아 화면은 꺼짐인데 푸시는 온다. 토큰을 되돌리고 실패로 알린다
      if (!writePushEnabled(true)) {
        await deletePushToken().catch(() => {});
        throw new PushPreferenceStorageError();
      }
      return { enabled: true };
    },
    onSuccess: (result) => {
      if ("denied" in result) toastAppError(APP_MESSAGE_CODE.notification.pushPermissionDenied);
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
