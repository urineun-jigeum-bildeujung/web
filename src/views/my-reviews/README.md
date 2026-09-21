# views/my-reviews

나의 상품 후기 화면. UI 시안 `mypa_041_작성가능`·`mypa_041_작성한`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/my-reviews-view.tsx` | 나의 상품 후기. 알약 세그먼트 탭과 두 목록. 작성한 리뷰는 `entities/review`의 `useQueryMyReviews`로 받는다 |
| `ui/my-reviews-view.test.tsx` | 탭 전환, 목록·빈 상태·받는 중·실패 표시 |
| `model/mock-reviews.ts` | 작성 가능한 후기 목데이터와 그 타입. 그 목록 API가 아직 없다 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/reviews` — `src/app/mypage/reviews/page.tsx`. 작성 가능·작성 완료 탭은 `?tab=writable|written`으로 구분한다.

## 탭이 shadcn Tabs인 이유

시안의 segment_control(회색 트랙 48 · 흰 알약 40 · 굵은 16)은 shadcn `Tabs` 기본 변형과 구조가 같아 클래스만 덮는다. 트랙 색은 시안 `control/bg/default`인데 그 토큰이 없어 `CheckboxRow`와 같은 판단으로 `surface-disable`을 쓴다.

## 작성한 리뷰는 서버, 작성 가능한 리뷰는 목데이터

작성한 리뷰는 `GET /reviews/me`를 그대로 보인다. 응답에 구매일이 없어 그 자리에 **작성일**을 보인다. 첫 쪽(20건)만 받고 더보기는 아직 없다.

작성 가능한 리뷰(구매 확정했고 아직 안 쓴 상품)는 **백엔드에 목록 API가 없다.** 구매 확인은 review-service가 내부에서만 부르고 주문 목록 응답에는 `productId`도 없다. 요청해 뒀고 그때까지 목데이터다(#291).
