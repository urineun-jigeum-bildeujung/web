# shared/api

백엔드 REST API 클라이언트와 공통 요청·에러 처리를 두는 곳이다.

**아직 비어 있다.** 백엔드 팀의 Swagger 명세가 공유되면 여기에 API 클라이언트를 만든다.

| 만들 파일 | 설명 |
| --- | --- |
| `client.ts` | 공통 fetch 래퍼 — base URL, 헤더, 에러 규격 |

- 슬라이스별 요청 함수와 쿼리 훅은 각 슬라이스의 `api/` 세그먼트에 둔다. 이 폴더는 그것들이 공통으로 쓰는 클라이언트와 에러 규격만 담는다.
- 백엔드 공통 에러 응답 포맷이 정해지면 사용자 노출 문구 규칙은 [app-message-convention](../../../docs/conventions/app-message-convention.md)을 따른다.
