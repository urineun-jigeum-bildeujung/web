// 브라우저 푸시(FCM) 토큰을 받고 지운다. 이 프로젝트에서 Firebase를 부르는 곳은 이 파일 하나다.
//
// firebase 모듈은 `firebase-sdk.ts`가 함수 안에서 동적으로 불러온다(첫 화면 번들·서버 렌더 제외).
// 등록 토큰은 Firebase 전용 프로토콜이라 브라우저 표준 `PushManager.subscribe`로 대체할 수 없다 —
// 백엔드가 Firebase Admin으로 보낸다.

import {
  FIREBASE_CONFIG,
  FIREBASE_VAPID_KEY,
  isFirebaseConfigured,
} from "@/shared/config/firebase";

import { loadFirebase } from "./firebase-sdk";

/** 서비스 워커 주소. `app/firebase-messaging-sw.js/route.ts`가 내려 준다 */
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

export type PushTokenResult =
  | { status: "granted"; token: string }
  /** 보호자가 권한 프롬프트에서 거부했거나 예전에 막아 두었다 */
  | { status: "denied" }
  /** 이 환경에서는 받을 수 없다. 브라우저 기능이 없거나 Firebase 설정이 비었다 */
  | { status: "unsupported" };

/** 이 브라우저가 푸시를 받을 수 있는가. 서버에서는 언제나 `false`다 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    isFirebaseConfigured()
  );
}

/** 알림 권한이 이미 허용돼 있는가. 스위치의 켜짐을 판정할 때 저장된 표시와 함께 본다 */
export function isPushPermissionGranted(): boolean {
  return isPushSupported() && Notification.permission === "granted";
}

async function loadMessaging() {
  const firebase = await loadFirebase();
  const app = firebase.getApps()[0] ?? firebase.initializeApp(FIREBASE_CONFIG);
  return { firebase, messaging: firebase.getMessaging(app) };
}

/**
 * 권한을 묻고 등록 토큰을 받는다. 권한 프롬프트는 이 함수를 부른 순간에 뜬다 — 보호자가 스위치를 켠
 * 직후여야 왜 뜨는지 알 수 있다.
 */
export async function requestPushToken(): Promise<PushTokenResult> {
  if (!isPushSupported()) return { status: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const [{ firebase, messaging }, registration] = await Promise.all([
    loadMessaging(),
    navigator.serviceWorker.register(SERVICE_WORKER_PATH),
  ]);
  const token = await firebase.getToken(messaging, {
    vapidKey: FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  return { status: "granted", token };
}

/** 이 기기의 토큰을 지운다. 서버에 남은 토큰은 백엔드가 해제 API를 보태면 함께 지운다 */
export async function deletePushToken(): Promise<void> {
  if (!isPushSupported()) return;
  const { firebase, messaging } = await loadMessaging();
  await firebase.deleteToken(messaging);
}
