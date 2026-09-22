// 환경 변수 타입 선언. .env.example과 짝으로 관리한다 — 변수를 추가하면 두 파일을 함께 갱신한다.
namespace NodeJS {
  interface ProcessEnv {
    // PRIVATE — 서버에서만 읽는 값. 브라우저 번들에 포함되지 않는다.

    // 행정안전부 도로명주소 검색 API 승인키. Route Handler에서만 읽는다.
    JUSO_CONFM_KEY?: string;

    // 서버 런타임(RSC 등)에서 백엔드 API를 부를 때 쓰는 절대 URL. 서버의 fetch는 same-origin
    // 상대 경로를 못 풀어 반드시 절대 URL이어야 한다. GitOps에서 실행 중인 컨테이너에 주입한다.
    API_BASE_URL_INTERNAL?: string;

    // PUBLIC — NEXT_PUBLIC_ 접두사가 붙은 값. 브라우저에 노출되므로 비밀값을 두지 않는다.

    // 백엔드 API base URL. 비우면 same-origin /api/v1을 쓴다.
    NEXT_PUBLIC_API_BASE_URL?: string;

    // 소셜 로그인 시작 주소의 base. 비우면 same-origin /api/auth를 쓴다.
    // 게이트웨이가 일반 API와 다른 경로로 보내므로 API base URL에서 파생하지 않는다.
    NEXT_PUBLIC_OAUTH_BASE_URL?: string;

    // 토스페이먼츠 클라이언트 키. 브라우저가 결제 UI를 띄울 때 쓰므로 노출되는 것이 정상이다.
    // 승인에 쓰는 시크릿 키는 여기 두지 않는다 — 그것은 백엔드가 쥔다.
    NEXT_PUBLIC_TOSS_CLIENT_KEY?: string;

    // Firebase 웹 앱 설정과 웹 푸시 VAPID 공개키. 클라이언트용 값이라 노출되는 것이 정상이다(#354).
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
    NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;

    // DEMO — 선언 방식을 보여주는 예시. 이렇게 선언하면 process.env.DEMO를 타입 안전하게 읽을 수 있다.
    DEMO: string;
  }
}
