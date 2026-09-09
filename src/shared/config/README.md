# shared/config

상수, Query Key, 환경 설정을 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `query-keys.ts` | TanStack Query Key 중앙 관리 factory (`QUERY_KEYS`) — 도메인별 구성 |
| `query-keys.test.ts` | factory 계층 규칙 단위 테스트 |

- Query Key는 호출부에서 배열을 직접 조립하지 않고 이 파일의 factory만 쓴다. 규칙은 [code-convention](../../../docs/conventions/code-convention.md)의 "TanStack Query Key" 절을 따른다.
- 도메인과 필터는 백엔드 API 명세의 GET 엔드포인트 파라미터 기준이다. 응답을 바꾸는 파라미터(아이 `petId`·정렬·상태 등)는 전부 키에 넣는다. 사용자와 무관한 정적 목록(건강 고민·알레르기·품종)은 `catalog` 도메인이다. 관리자(admin) 엔드포인트는 화면 범위 확정 전이라 아직 없다.
- 조회지만 POST인 상품 비교·주문서 조회는 키를 두지 않았다. 슬라이스가 캐시할 때 추가한다.
- 사용자에게 보이는 문구 상수(`APP_MESSAGE`·`FORM_MESSAGE`)도 도입 시점에 여기 들어온다.
