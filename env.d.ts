// 환경 변수 타입 선언. .env.example과 짝으로 관리한다 — 변수를 추가하면 두 파일을 함께 갱신한다.
namespace NodeJS {
  interface ProcessEnv {
    // PRIVATE — 서버에서만 읽는 값. 브라우저 번들에 포함되지 않는다.

    // 행정안전부 도로명주소 검색 API 승인키. Route Handler에서만 읽는다.
    JUSO_CONFM_KEY?: string;

    // PUBLIC — NEXT_PUBLIC_ 접두사가 붙은 값. 브라우저에 노출되므로 비밀값을 두지 않는다.

    // 백엔드 API base URL. 비우면 same-origin /api/v1을 쓴다.
    NEXT_PUBLIC_API_BASE_URL?: string;

    // 토스페이먼츠 클라이언트 키. 브라우저가 결제 UI를 띄울 때 쓰므로 노출되는 것이 정상이다.
    // 승인에 쓰는 시크릿 키는 여기 두지 않는다 — 그것은 백엔드가 쥔다.
    NEXT_PUBLIC_TOSS_CLIENT_KEY?: string;

    // DEMO — 선언 방식을 보여주는 예시. 이렇게 선언하면 process.env.DEMO를 타입 안전하게 읽을 수 있다.
    DEMO: string;
  }
}
