// "이 기기에서 푸시를 켰다"는 표시. 권한은 브라우저가 쥐고 있어 켰다/껐다는 따로 남겨야 한다.
//
// 설정의 알림 스위치가 쓰고, 앱 전역의 포그라운드 수신(`PushMessageListener`)이 켜져 있을 때만
// 구독하려고 함께 본다. 켜짐 = 권한이 허용돼 있고 이 표시가 있을 때. 브라우저 설정에서 권한을
// 거두면 표시가 남아 있어도 꺼짐이다.

import { isPushPermissionGranted } from "./fcm";

const STORAGE_KEY = "push-enabled";

// 저장값이 바뀌면 `useSyncExternalStore`가 다시 읽게 알린다
const listeners = new Set<() => void>();

export function subscribePushPreference(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readPushEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1" && isPushPermissionGranted();
  } catch {
    return false;
  }
}

export function writePushEnabled(next: boolean) {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장이 막힌 브라우저면 새로고침 뒤 꺼짐으로 돌아온다. 그 이상은 할 것이 없다
  }
  listeners.forEach((listener) => listener());
}
