# shared/api

백엔드 REST API 클라이언트와 공통 요청·에러 처리를 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `client.ts` | 공통 fetch 래퍼(`apiRequest`)와 `ApiError`·`ProblemDetail`, `isValidationError`·`shouldRetryQuery` — base URL·헤더·쿼리 조립·401 재발급을 한 곳으로 모음 |
| `client.test.ts` | `apiRequest` 단위 테스트 |
| `token-store.ts` | 인증 토큰 보관소 — accessToken 메모리, refreshToken localStorage. `hasSession`·`subscribeTokensCleared` 포함 |
| `token-store.test.ts` | 토큰 보관소 단위 테스트 |

- base URL은 `NEXT_PUBLIC_API_BASE_URL`을 읽고, 없으면 `/api/v1`을 쓴다.
- 성공 응답은 리소스를 그대로 반환하고, 실패 응답은 Spring 표준 ProblemDetail(RFC 9457)을 파싱해 `ApiError.problem`에 담는다. timestamp·traceId는 응답에 없다(traceId는 백엔드 로깅 전용).
- accessToken이 있으면 요청에 `Authorization: Bearer`를 붙인다. 권한 매트릭스상 PUBLIC 엔드포인트(상품·타임딜·리뷰 조회)는 `auth: false`로 부르면 토큰을 붙이지 않고 401에도 재발급하지 않는다. PUBLIC 여부 판단은 슬라이스 api 세그먼트가 한다.
- 401이면 재발급(`/auths/token/refresh`) 후 원 요청을 1회 재시도한다. 재발급은 rotation 정책(중복 호출 시 탈취 간주) 때문에 동시 401에서도 한 번만 호출된다(single-flight). 게이트웨이가 JWT를 먼저 검증하므로 재발급 요청에는 만료된 accessToken을 붙이지 않는다. 재발급까지 실패하면 토큰을 지우고 401을 그대로 던진다 — 로그인 이동·캐시 비우기 같은 앱 정책은 `subscribeTokensCleared`로 구독한 쪽이 처리한다.
- `query` 옵션은 undefined·null을 빼고 배열은 같은 키를 반복해 쿼리 스트링을 만든다. `FormData` 본문은 직렬화하지 않고 Content-Type도 붙이지 않는다(이미지 업로드용).
- `shouldRetryQuery`는 `AppProviders`의 QueryClient 기본 retry다. 4xx는 재시도하지 않고 5xx·네트워크 오류만 1회 재시도한다.
- 웹뷰에서도 토큰은 웹이 보관하고 재발급도 웹만 한다. 네이티브는 딥링크로 받은 토큰을 웹 콜백 URL로 넘기기만 한다. 소셜 로그인 콜백 화면은 로그인 디자인 확정 뒤 별도 슬라이스에서 만든다.
- 슬라이스별 요청 함수와 쿼리 훅은 각 슬라이스의 `api/` 세그먼트에 둔다. 이 폴더는 그것들이 공통으로 쓰는 클라이언트와 에러 규격만 담는다.
- 백엔드 공통 에러 응답 포맷이 정해지면 사용자 노출 문구 규칙은 [app-message-convention](../../../docs/conventions/app-message-convention.md)을 따른다.
