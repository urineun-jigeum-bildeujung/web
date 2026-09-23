# shared/config

상수, Query Key, 환경 설정을 두는 곳이다.

| 파일 | 설명 |
| --- | --- |
| `query-keys.ts` | TanStack Query Key 중앙 관리 factory (`QUERY_KEYS`) — 도메인별 구성 |
| `query-keys.test.ts` | factory 계층 규칙 단위 테스트 |
| `firebase.ts` | Firebase 웹 앱 설정(`FIREBASE_CONFIG`)·VAPID 키. `NEXT_PUBLIC_FIREBASE_*`를 읽는다. 브라우저와 서비스 워커 라우트가 같은 값을 본다 |
| `observability.ts` | Grafana Faro 수집 주소·키(`FARO_CONFIG`)와 앱 이름. `NEXT_PUBLIC_FARO_*`를 읽고 둘 다 있을 때만 켠다(`isFaroConfigured`) (#396) |
| `observability.test.ts` | 주소나 키가 하나라도 비면 켜지 않는지 본다 |
| `app-message.ts` | 사용자에게 보이는 문구(`APP_MESSAGE`)와 그 코드(`APP_MESSAGE_CODE`) — 화면은 코드만 넘기고 문구는 여기서 찾는다 |

- Query Key는 호출부에서 배열을 직접 조립하지 않고 이 파일의 factory만 쓴다. 규칙은 [code-convention](../../../docs/conventions/code-convention.md)의 "TanStack Query Key" 절을 따른다.
- 도메인과 필터는 백엔드 API 명세의 GET 엔드포인트 파라미터 기준이다. 응답을 바꾸는 파라미터(아이 `petId`·정렬·상태 등)는 전부 키에 넣는다. 사용자와 무관한 정적 목록(건강 고민·알레르기·품종)은 `catalog` 도메인이다. 관리자(admin) 엔드포인트는 화면 범위 확정 전이라 아직 없다.
- 조회지만 POST인 상품 비교·주문서 조회는 키를 두지 않았다. 슬라이스가 캐시할 때 추가한다.
- 사용자에게 보이는 문구 상수(`APP_MESSAGE`·`FORM_MESSAGE`)도 도입 시점에 여기 들어온다.
