// 푸시 수신용 서비스 워커 스크립트를 내려 주는 라우트.
// `public/`의 정적 파일은 환경변수를 못 읽어 Firebase 설정을 두 벌 들게 된다. 여기서 만들어 내려 주면
// `shared/config/firebase`의 한 벌만 있다. 백그라운드 알림은 `notification` 페이로드를 SDK가 그대로 띄운다.

import { FIREBASE_CONFIG } from "@/shared/config/firebase";

/** `package.json`의 firebase와 같은 판이어야 브라우저 쪽과 어긋나지 않는다 */
const FIREBASE_VERSION = "12.19.0";

export function GET() {
  const script = [
    `importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js");`,
    `importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js");`,
    `firebase.initializeApp(${JSON.stringify(FIREBASE_CONFIG)});`,
    `firebase.messaging();`,
    "",
  ].join("\n");

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // 설정이 바뀐 배포 뒤에도 옛 워커 스크립트를 오래 들고 있지 않게 한다
      "Cache-Control": "no-cache",
    },
  });
}
