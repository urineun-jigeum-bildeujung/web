// 설정의 알림 스위치. 뜻은 "이 기기의 푸시 허용"이다 — 권한 → 토큰 → 서버 등록 → 표시 저장을 여기서 묶는다.
//
// 서버 구독(`subscriptions/{category}`)은 쓰지 않는다. 카테고리가 `TIME_DEAL` 하나라 "알림설정"과
// 뜻이 안 맞는다(#354). 켜짐은 **권한이 허용돼 있고 이 기기에서 켰다는 표시가 있을 때**다.
// 권한만 있고 껐으면 꺼짐이고, 브라우저 설정에서 권한을 거둬도 꺼짐으로 보인다.

import { useMutation } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { registerFcmToken } from "@/entities/notification";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import {
  deletePushToken,
  isPushPermissionGranted,
  isPushSupported,
  requestPushToken,
} from "@/shared/lib/push/fcm";

/** 이 기기에서 켰다는 표시. 권한은 브라우저가 쥐고 있어 "켰다/껐다"는 따로 남겨야 한다 */
const STORAGE_KEY = "push-enabled";

// 저장값이 바뀌면 `useSyncExternalStore`가 다시 읽게 알린다. 서버 렌더에서는 `window`가 없어
// 언제나 꺼짐·지원으로 그리고 클라이언트가 실제 값으로 바꾼다 — `useState` 초기값으로 읽으면
// 서버와 첫 렌더가 어긋나 하이드레이션 경고가 난다
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1" && isPushPermissionGranted();
  } catch {
    return false;
  }
}

function writeEnabled(next: boolean) {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장이 막힌 브라우저면 새로고침 뒤 꺼짐으로 돌아온다. 그 이상은 할 것이 없다
  }
  listeners.forEach((listener) => listener());
}

/** 권한이 없어 켜지 못했다. 서버 실패와 다른 문구가 필요해 가른다 */
class PushPermissionError extends Error {
  constructor() {
    super("push permission not granted");
  }
}

export function useMutatePushSetting() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
  const supported = useSyncExternalStore(subscribe, isPushSupported, () => true);

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
    onSuccess: writeEnabled,
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
