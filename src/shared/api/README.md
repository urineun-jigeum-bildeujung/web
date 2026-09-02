# shared/api

백엔드 REST API 클라이언트와 공통 요청·에러 처리를 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `client.ts` | 공통 fetch 래퍼(`apiRequest`)와 `ApiError`·`ProblemDetail` — base URL·헤더 조립·401 재발급을 한 곳으로 모음 |
| `client.test.ts` | `apiRequest` 단위 테스트 |
| `token-store.ts` | 인증 토큰 보관소 — accessToken 메모리, refreshToken localStorage |
| `token-store.test.ts` | 토큰 보관소 단위 테스트 |

- base URL은 `NEXT_PUBLIC_API_BASE_URL`을 읽고, 없으면 `/api/v1`을 쓴다.
- 성공 응답은 리소스를 그대로 반환하고, 실패 응답은 Spring 표준 ProblemDetail(RFC 9457)을 파싱해 `ApiError.problem`에 담는다. timestamp·traceId는 응답에 없다(traceId는 백엔드 로깅 전용).
- accessToken이 있으면 모든 요청에 `Authorization: Bearer`를 붙인다. 401이면 재발급(`/auths/token/refresh`) 후 원 요청을 1회 재시도한다. 재발급은 rotation 정책(중복 호출 시 탈취 간주) 때문에 동시 401에서도 한 번만 호출된다(single-flight). 재발급까지 실패하면 토큰을 지우고 401을 그대로 던진다 — 로그인 이동 같은 앱 정책은 호출부가 처리한다.
- 소셜 로그인 리다이렉트에서 토큰을 수령해 `saveTokens`로 넣는 콜백 화면은 별도 슬라이스에서 만든다(#83 범위 밖).
- 슬라이스별 요청 함수와 쿼리 훅은 각 슬라이스의 `api/` 세그먼트에 둔다. 이 폴더는 그것들이 공통으로 쓰는 클라이언트와 에러 규격만 담는다.
- 백엔드 공통 에러 응답 포맷이 정해지면 사용자 노출 문구 규칙은 [app-message-convention](../../../docs/conventions/app-message-convention.md)을 따른다.
