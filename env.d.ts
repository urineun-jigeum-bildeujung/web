// 환경 변수 타입 선언. .env.example과 짝으로 관리한다 — 변수를 추가하면 두 파일을 함께 갱신한다.
namespace NodeJS {
  interface ProcessEnv {
    // PRIVATE — 서버에서만 읽는 값. 브라우저 번들에 포함되지 않는다.

    // PUBLIC — NEXT_PUBLIC_ 접두사가 붙은 값. 브라우저에 노출되므로 비밀값을 두지 않는다.

    // DEMO — 선언 방식을 보여주는 예시. 이렇게 선언하면 process.env.DEMO를 타입 안전하게 읽을 수 있다.
    DEMO: string;
  }
}
