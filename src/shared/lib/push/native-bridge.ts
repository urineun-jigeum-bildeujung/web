// 앱 셸(RN 웹뷰)과 주고받는 푸시 신호. 앱이 FCM 토큰을 대신 받아 주고, 열려 있을 때 온 푸시를 알려 준다.
//
// 웹뷰에는 Push API가 없어 `fcm.ts`가 물러난다. Android 앱은 네이티브로 토큰을 받을 수 있어(iOS는 APNs가
// 유료 계정에 묶여 아직 아니다) 앱이 받아 웹에 넘기고, 서버 등록은 로그인 세션을 쥔 웹이 한다(#403).
// 이름은 mobile 저장소 `src/lib/web-event.ts`와 맞춘다. 한쪽만 바꾸면 신호가 조용히 사라진다.

import type { PushTokenResult } from "./fcm";

/** 앱 → 웹 window 이벤트 */
const NATIVE_EVENT = {
  pushToken: "golaju:push-token",
  pushDenied: "golaju:push-denied",
  pushReceived: "golaju:push-received",
} as const;

/** 웹 → 앱 메시지의 `type` */
const NATIVE_MESSAGE = {
  requestPushToken: "golaju:request-push-token",
} as const;

/** 앱이 권한 프롬프트를 띄운 채 답이 없으면 이만큼 뒤에 거부로 본다. 프롬프트는 오래 열려 있을 수 있다 */
const TOKEN_TIMEOUT_MS = 120_000;

declare global {
  interface Window {
    /** 앱이 문서를 읽기 전에 넣는다. 브라우저에는 없다 */
    golajuNative?: { pushSupported: boolean };
    /** react-native-webview가 넣는다. 브라우저에는 없다 */
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

/** 앱 셸 안에서 열렸는가. 서버·브라우저에서는 언제나 `false`다 */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && window.golajuNative !== undefined;
}

/** 이 웹뷰의 앱이 푸시를 받아 줄 수 있는가(지금은 Android). iOS 앱은 앱이지만 아니다 */
export function isNativePushSupported(): boolean {
  return isNativeApp() && window.golajuNative?.pushSupported === true;
}

/**
 * 앱에 권한을 묻고 토큰을 받아 오게 한다. 브라우저의 `requestPushToken`과 같은 모양으로 돌려준다.
 * 앱이 답하지 않으면(권한 프롬프트를 오래 붙들거나 앱이 신호를 모르면) 거부로 본다.
 */
export function requestNativePushToken(): Promise<PushTokenResult> {
  const app = isNativePushSupported() ? window.ReactNativeWebView : undefined;
  if (!app) return Promise.resolve({ status: "unsupported" });

  return new Promise((resolve) => {
    const finish = (result: PushTokenResult) => {
      window.clearTimeout(timer);
      window.removeEventListener(NATIVE_EVENT.pushToken, onToken);
      window.removeEventListener(NATIVE_EVENT.pushDenied, onDenied);
      resolve(result);
    };
    const onToken = (event: Event) => {
      const token = (event as CustomEvent<unknown>).detail;
      finish(
        typeof token === "string" && token ? { status: "granted", token } : { status: "denied" },
      );
    };
    const onDenied = () => finish({ status: "denied" });
    const timer = window.setTimeout(() => finish({ status: "denied" }), TOKEN_TIMEOUT_MS);

    window.addEventListener(NATIVE_EVENT.pushToken, onToken);
    window.addEventListener(NATIVE_EVENT.pushDenied, onDenied);
    app.postMessage(JSON.stringify({ type: NATIVE_MESSAGE.requestPushToken }));
  });
}

/** 앱이 열려 있을 때 푸시가 왔다는 신호를 듣는다. 끊는 함수를 돌려준다 */
export function subscribeNativePushReceived(listener: () => void): () => void {
  if (!isNativePushSupported()) return () => {};
  window.addEventListener(NATIVE_EVENT.pushReceived, listener);
  return () => window.removeEventListener(NATIVE_EVENT.pushReceived, listener);
}
