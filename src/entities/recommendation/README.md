# entities/recommendation

고른 아이에게 맞는 상품을 AI 추천 API에서 받는다. 메인 "AI가 골라주는 맞춤 상품"과 맞춤 추천 화면(`/recommendations`)이 함께 쓴다(#600).

| 파일 | 설명 |
| --- | --- |
| `api/recommendations.ts` | `POST /recommend/home` 호출(`getHomeRecommendations`). 아이·분류·개수를 snake_case로 보내고 항목을 화면 모양으로 옮긴다 |
| `api/recommendations.test.ts` | 요청 경로·본문(간식은 `treat`, 전체·기본 개수는 안 보냄)과 응답 옮기기 |
| `api/use-query-home-recommendations.ts` | 맞춤 추천 조회 훅. 아이가 없으면 부르지 않고, 받아 둔 것 없이 실패하면 오류 경계로 던진다 |
| `api/use-query-home-recommendations.test.tsx` | 부르지 않는 조건, 받은 인자, 아이를 바꾸면 그 아이로 다시 부르는지(키에 아이가 들어가는지), 실패를 경계가 받는지 |
| `model/recommendation.ts` | 응답 타입(snake_case)과 화면 타입(camelCase), 분류·점수·상태·단가 변환과 단가 줄 문장(`formatUnitPriceLine`) |
| `model/recommendation.test.ts` | 변환 규칙 |
| `model/sort.ts` | 정렬 값(추천순·최신순·별점 높은순·낮은순)과 받은 목록 안에서의 정렬 |
| `model/sort.test.ts` | 네 정렬이 서로 다른 순서를 내는지, 같은 값은 추천 순서를 지키는지, 후기 없는 상품이 별점 정렬 뒤에 오는지 |
| `ui/recommendation-reason.tsx` | 카드의 추천 이유와 알레르기 감점 주의 한 줄 |
| `ui/recommendation-reason.test.tsx` | 이유가 읽히는지, 감점 상품에만 주의가 붙는지 |
| `ui/sale-status-badge.tsx` | 사진 위 품절·타임딜 배지. 판매 중이면 그리지 않는다 |
| `ui/sale-status-badge.test.tsx` | 상태별 배지 |
| `index.ts` | 공개 API |

## 왜 `entities/product`가 아닌가

추천은 상품 서비스가 아니라 생성형 AI팀의 별도 서비스(`/recommend`)이고, 응답 규약(snake_case)과 개념(추천 순위·이유·알레르기 감점)이 상품 목록과 다르다. 엔티티는 백엔드 도메인과 대체로 1:1이라 슬라이스를 나눴다.

같은 레이어끼리는 import하지 않으므로 적합도 배지(`MatchScoreBadge`)는 이 슬라이스가 쓰지 않고, 카드를 조립하는 화면(`views/home`·`views/recommendations`)이 두 슬라이스를 함께 부른다.

## 카드 표기는 시안을 따른다

PM QA 기록에 이 카드의 표기를 정한 것이 없어, 시안(메인 1758-68917, 추천 1585-16763)의 텍스트 표기에 맞췄다. API 값이 시안과 다르면 이 슬라이스의 변환에서 시안 표기로 바꾼다.

- 적합도 "적합도 N점", 가격·할인율·정가 취소선, 별점 "★ 4.8 후기 N개"는 시안 그대로다
- **단가 줄은 메인 시안의 "1개당 800원" 꼴**("1g당 19원", `formatUnitPriceLine`)이다. 상품 목록·타임딜의 `formatUnitPrice`("1g당 약 19원", 타임딜 시안 1905-32428)와 달리 "약"이 없다
- **추천 화면 시안의 "하루 예상 급여비 약 N원"은 그리지 못한다.** 하루 급여량이 응답에 없다. 대신 메인과 같은 단가 줄을 쓴다
- 시안에 없는 것(추천 이유, 알레르기 주의 한 줄, 품절·타임딜 배지)은 기존 토큰으로 가장 단순하게 두었다. PD 확인거리다

## API 계약

- **경로** `POST /api/v1/recommend/home`. 인프라 공용 라우터를 거치므로 기존 `apiRequest`로 부른다(인증 헤더 자동). 게이트웨이(백엔드 `sever`의 `api-gateway` `application-infra.yml`, 백엔드 PR #194)가 `/api/v1/recommend/**`를 `/recommend/**`로 바꿔 추천 서버(FastAPI, `RECOMMENDATION_SERVICE_URL`)에 넘긴다.
- **사진 주소** `thumbnail_url`은 추천 서버가 상품 DB(`products.thumbnail_url`)에서 그대로 읽는다. dev 배포는 `USE_DUMMY_DATA=false`라 상품 서비스와 같은 주소다. 더미 모드(`cdn.example.com`)로 뜨면 `next.config.ts`의 허용 호스트 밖이라 사진이 빈 칸이 된다.
- **명세** AI팀 v3.0.0(2026-09-30). 요청 `{ pet_id, category?, sort?, size? }`, 응답 `{ pet_id, pet_name, generated_at, items[] }`.
- `/recommend/substitute`는 지금 항상 빈 배열이고 화면도 없어 부르지 않는다. `/recommend/exclusions`는 폐기됐다.
- 오류는 400(분류 값 틀림)·404(아이 없음). 화면은 둘 다 추천 칸의 오류 경계로 받는다.

## 명세와 다른 값은 여기서 바꿔 쓴다

AI팀 답을 더 기다리지 않고 FE가 맞춘다(FE 팀장 결정). 규칙이 `model/recommendation.ts` 한곳에 있어 명세가 바뀌면 그 파일만 고친다.

| 값 | 명세 | 화면 |
| --- | --- | --- |
| 분류(요청) | 생략·`food`·`treat`·`supplement` | 전체·`food`·`snack`·`supplement` |
| 분류(응답) | `FOOD`·`TREAT`·`SUPPLEMENT` | `food`·`snack`·`supplement`. 모르는 값은 받은 그대로 |
| 점수 | 0~100 | 0~100 정수. 0 초과 1 미만 소수는 예전 0~1 방식으로 보고 ×100 반올림, 범위 밖은 0·100에 가둔다. `null`·누락은 null("정보 확인 중"). AI팀이 배포 버전의 척도를 0~100으로 확정하면 소수 처리는 걷어 낸다 |
| 상태 | `ON_SALE` 등(목록 없음) | 대소문자·구분자 무시. `SOLD_OUT`·`OUT_OF_STOCK` → 품절, `TIME_DEAL`·`DEAL` → 타임딜, 그 밖은 판매 중 |
| 단가 | `unit_price` + `unit_label`(`"1000G"`) | 양을 떼고 단위만 소문자(`g`), 가격은 원 단위 반올림 → "1g당 19원"(`formatUnitPriceLine`). 단위를 못 읽거나 반올림한 가격이 1원 미만이면 줄을 숨긴다 |
| 알레르기 | `PENALIZED` + `matched_allergen` 코드 | 목록에 남기고 "등록한 알레르기 성분이 들어 있어요" 한 줄. 코드는 넘기지 않는다 |
| 아이 이름 | `pet_name` | 쓰지 않는다. 아이 목록(`/members/me/pets`)의 이름을 쓴다 |

**점수의 정수 1은 1점이다.** JSON에서 `1`과 `1.0`은 가를 수 없어 0~1 방식의 1(100%)과 0~100 방식의 1점이 겹친다. 1을 100점으로 올리면 거의 안 맞는 상품이 가장 잘 맞는 상품이 되므로 낮게 읽는 쪽을 골랐다.

**`PENDING`(성분 분석 전, 30% 감점)에는 아무것도 붙이지 않는다.** 지금 거의 오지 않고, 보호자에게 알릴 내용(무엇이 아직 모르는지)이 정해지지 않았다.

## 정렬은 받은 목록 안에서 FE가 한다

**AGENTS 2.5의 "서버에서 할 수 있는 정렬은 서버로"의 예외다.** 추천 API의 `sort`는 추천순(`recommend`) 하나뿐이라 최신순·별점순을 요청할 방법이 없다. 그래서 `/recommendations`는 한 번에 받을 수 있는 최대(`size: 50`)를 받아 그 안에서 정렬한다. 50개를 넘는 상품은 어느 정렬에서도 보이지 않는다 — 서버가 정렬을 지원하면 요청 파라미터로 옮긴다.

- 추천순은 서버 순서(`rank`) 그대로다
- 최신순은 `created_at`, 별점순은 `rating`이다. 같은 값끼리는 추천 순서를 지킨다
- 후기가 없는 상품(`review_count` 0)은 두 별점 정렬 모두 뒤로 보낸다. 별점이 0으로 와 낮은순 맨 앞에 서는데, 카드는 후기가 없으면 별점을 "-"로 그려 가장 낮은 상품처럼 보이지 않는다

**분류는 서버가 거른다.** 요청에 `category`가 있어 받은 목록을 다시 `filter`하지 않는다.

## 실패와 대기

- 훅이 **받아 둔 것 없이 실패하면 오류를 던진다.** 칸을 `shared/ui/error-boundary`로 감싸 추천만 실패하고 같은 화면의 다른 칸은 남는다. 그 경계의 "다시 시도"가 `QueryErrorResetBoundary`로 조회를 리셋한다. 이미 그린 목록이 있으면 배경 재조회가 실패해도 던지지 않는다
- 아이가 없으면(로그인 전·아이 0마리·아이 목록 실패) `skipToken`으로 부르지 않고, 기다리는 중으로도 남지 않는다
