// Firebase 웹 앱 설정. 클라이언트용 값이라 브라우저에 노출되는 것이 정상이고, 서버 키는 백엔드가 쥔다.
// 브라우저(shared/lib/push)와 서비스 워커를 내려 주는 라우트가 같은 값을 읽어 설정이 한 벌만 있다.

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
} as const;

/** 웹 푸시 인증서 공개키. 없으면 Chrome이 토큰을 내주지 않는다 */
export const FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/** 값이 하나라도 비면 토큰을 받을 수 없다. 스위치를 잠글 때 본다 */
export function isFirebaseConfigured(): boolean {
  return Object.values(FIREBASE_CONFIG).every(Boolean) && FIREBASE_VAPID_KEY !== "";
}
