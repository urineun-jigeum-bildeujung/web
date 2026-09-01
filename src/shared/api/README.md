# shared/api

백엔드 REST API 클라이언트와 공통 요청·에러 처리를 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `client.ts` | 공통 fetch 래퍼(`apiRequest`)와 `ApiError`·`ProblemDetail` — base URL·헤더 조립을 한 곳으로 모음 |
| `client.test.ts` | `apiRequest` 단위 테스트 |

- base URL은 `NEXT_PUBLIC_API_BASE_URL`을 읽고, 없으면 `/api/v1`을 쓴다.
- 성공 응답은 리소스를 그대로 반환하고, 실패 응답은 Spring 표준 ProblemDetail(RFC 9457)을 파싱해 `ApiError.problem`에 담는다. timestamp·traceId는 응답에 없다(traceId는 백엔드 로깅 전용).
- 인증(JWT) 헤더는 방식 확정 후 `client.ts`의 `buildHeaders`에만 추가한다. 토큰 재발급 흐름도 규격 확정 후 여기에 붙인다.
- 슬라이스별 요청 함수와 쿼리 훅은 각 슬라이스의 `api/` 세그먼트에 둔다. 이 폴더는 그것들이 공통으로 쓰는 클라이언트와 에러 규격만 담는다.
- 백엔드 공통 에러 응답 포맷이 정해지면 사용자 노출 문구 규칙은 [app-message-convention](../../../docs/conventions/app-message-convention.md)을 따른다.
