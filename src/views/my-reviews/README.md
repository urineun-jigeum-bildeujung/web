# views/my-reviews

나의 상품 후기 화면. UI 시안 `mypa_041_작성가능`·`mypa_041_작성한`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/my-reviews-view.tsx` | 나의 상품 후기. 알약 세그먼트 탭과 두 목록 |
| `ui/my-reviews-view.test.tsx` | 탭 전환, 목록·빈 상태 표시 |
| `model/mock-reviews.ts` | 작성 가능·작성한 후기 목데이터와 그 타입 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/reviews` — `src/app/mypage/reviews/page.tsx`. 작성 가능·작성 완료 탭은 `?tab=writable|written`으로 구분한다.

## 탭이 shadcn Tabs인 이유

시안의 segment_control(회색 트랙 48 · 흰 알약 40 · 굵은 16)은 shadcn `Tabs` 기본 변형과 구조가 같아 클래스만 덮는다. 트랙 색은 시안 `control/bg/default`인데 그 토큰이 없어 `CheckboxRow`와 같은 판단으로 `surface-disable`을 쓴다.

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다.
