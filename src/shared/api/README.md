# shared/api

백엔드 REST API 클라이언트와 공통 요청·에러 처리를 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `client.ts` | 공통 fetch 래퍼(`apiRequest`)와 `ApiError`·`ProblemDetail`, `isValidationError`·`shouldRetryQuery` — base URL·헤더·쿼리 조립·401 재발급을 한 곳으로 모음 |
| `client.test.ts` | `apiRequest` 단위 테스트 |
| `token-store.ts` | 인증 토큰 보관소 — accessToken 메모리, refreshToken localStorage. `hasSession`·`subscribeTokensCleared` 포함 |
| `token-store.test.ts` | 토큰 보관소 단위 테스트 |
| `error-message.ts` | 실패 응답을 문구 코드로 옮긴다(`toAppMessageCode`) — `errorCode` 매핑, 없으면 상태 코드 기준 |
| `error-message.test.ts` | 매핑·fallback·네트워크 실패 구분 단위 테스트 |
| `upload-image.ts` | 이미지 한 장을 presigned URL로 S3에 직접 올리고 `fileUrl`을 돌려준다(`uploadImage`). 회원·아이 사진 발급 함수와 `ImageUploadError` 포함 |
| `upload-image.test.ts` | 확장자 뽑기, 발급 본문, PUT 헤더(`x-amz-tagging`), 실패 구분 |

- base URL은 `NEXT_PUBLIC_API_BASE_URL`을 읽고, 없으면 `/api/v1`을 쓴다.
- 성공 응답은 리소스를 그대로 반환하고, 실패 응답은 Spring 표준 ProblemDetail(RFC 9457)을 파싱해 `ApiError.problem`에 담는다. timestamp·traceId는 응답에 없다(traceId는 백엔드 로깅 전용).
- accessToken이 있으면 요청에 `Authorization: Bearer`를 붙인다. 권한 매트릭스상 PUBLIC 엔드포인트(상품·타임딜·리뷰 조회)는 `auth: false`로 부르면 토큰을 붙이지 않고 401에도 재발급하지 않는다. PUBLIC 여부 판단은 슬라이스 api 세그먼트가 한다.
- 401이면 재발급(`/auths/token/refresh`) 후 원 요청을 1회 재시도한다. 재발급은 rotation 정책(중복 호출 시 탈취 간주) 때문에 동시 401에서도 한 번만 호출된다(single-flight). 게이트웨이가 JWT를 먼저 검증하므로 재발급 요청에는 만료된 accessToken을 붙이지 않는다. 재발급까지 실패하면 토큰을 지우고 401을 그대로 던진다 — 로그인 이동·캐시 비우기 같은 앱 정책은 `subscribeTokensCleared`로 구독한 쪽이 처리한다.
- **성공 응답에 본문이 없으면 그대로 끝낸다.** 204만이 아니라 **본문 없는 200도** 그렇다 — 명세가 `200 OK`만 약속하는 엔드포인트가 있다(장바구니 수량 변경). 곧장 `json()`을 부르면 빈 본문에서 던져 성공한 요청이 실패로 읽힌다 (#217).
- `query` 옵션은 undefined·null을 빼고 배열은 같은 키를 반복해 쿼리 스트링을 만든다. `FormData` 본문은 직렬화하지 않고 Content-Type도 붙이지 않는다(이미지 업로드용).
- `shouldRetryQuery`는 `AppProviders`의 QueryClient 기본 retry다. 4xx는 재시도하지 않고 5xx·네트워크 오류만 1회 재시도한다.
- 소셜 로그인은 백엔드가 `/auth/callback?code=`로 일회용 code만 넘기고(실패는 `?error=login_failed`), 프론트가 `POST /auths/token/exchange`에 `{ code }`를 보내 accessToken·refreshToken·**needsSignup**·nickname을 받는다(토큰이 없는 상태라 `auth: false`). code는 1회용이고 60초 뒤 만료된다. 신규 회원 여부가 아니라 `needsSignup`으로 가입 화면을 가른다 — 첫 로그인에서 가입을 마치지 않고 이탈한 사람은 다시 로그인해도 더 이상 신규가 아니라 가입에 영영 닿지 못한다. 콜백 화면과 교환 함수는 `views/auth-callback`에 있다.
- 웹뷰에서도 토큰은 웹이 보관하고 재발급도 웹만 한다. 네이티브는 딥링크로 받은 code를 웹 콜백 URL로 넘기기만 한다.
- 슬라이스별 요청 함수와 쿼리 훅은 각 슬라이스의 `api/` 세그먼트에 둔다. 이 폴더는 그것들이 공통으로 쓰는 클라이언트와 에러 규격만 담는다.
- 백엔드 공통 에러 응답 포맷이 정해지면 사용자 노출 문구 규칙은 [app-message-convention](../../../docs/conventions/app-message-convention.md)을 따른다.
