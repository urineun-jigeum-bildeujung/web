# shared/config

상수, Query Key, 환경 설정을 두는 곳이다.

**아직 비어 있다.** 첫 API 연동을 하는 사람이 `query-keys.ts`를 만든다.

| 만들 파일 | 설명 |
| --- | --- |
| `query-keys.ts` | TanStack Query Key 중앙 관리 (`QUERY_KEYS`) |

- Query Key는 호출부에서 배열을 직접 조립하지 않고 이 파일의 factory만 쓴다. 규칙은 [code-convention](../../../docs/conventions/code-convention.md)의 "TanStack Query Key" 절을 따른다.
- 사용자에게 보이는 문구 상수(`APP_MESSAGE`·`FORM_MESSAGE`)도 도입 시점에 여기 들어온다.
