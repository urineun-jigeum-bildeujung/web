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

/**
 * 표시를 저장한다. **저장이 막힌 브라우저면 `false`를 돌려주고 아무에게도 알리지 않는다.**
 * 부르는 쪽이 토큰 쪽을 되돌려야 한다 — 표시 없이 서버에만 토큰이 남으면 화면은 꺼짐인데 푸시는 온다.
 */
export function writePushEnabled(next: boolean): boolean {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}
