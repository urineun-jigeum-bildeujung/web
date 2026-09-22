# views/my-reviews

나의 상품 후기 화면. UI 시안 `mypa_041_작성가능`·`mypa_041_작성한`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/my-reviews-view.tsx` | 나의 상품 후기. 알약 세그먼트 탭과 두 목록. 작성 가능한 리뷰는 `useQueryWritableReviews`, 작성한 리뷰는 `useQueryMyReviews`로 받는다 |
| `ui/my-reviews-view.test.tsx` | 탭 전환, 두 탭 각각의 목록·빈 상태·받는 중·실패 표시 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/reviews` — `src/app/mypage/reviews/page.tsx`. 작성 가능·작성 완료 탭은 `?tab=writable|written`으로 구분한다.

## 탭이 shadcn Tabs인 이유

시안의 segment_control(회색 트랙 48 · 흰 알약 40 · 굵은 16)은 shadcn `Tabs` 기본 변형과 구조가 같아 클래스만 덮는다. 트랙 색은 시안 `control/bg/default`인데 그 토큰이 없어 `CheckboxRow`와 같은 판단으로 `surface-disable`을 쓴다.

## 두 탭 모두 서버에서 받는다

작성한 리뷰는 `GET /reviews/me`를 그대로 보인다. 응답에 구매일이 없어 그 자리에 **작성일**을 보인다. 첫 쪽(20건)만 받고 더보기는 아직 없다.

작성 가능한 리뷰는 `GET /reviews/writable`(#349)이다. 구매확정된 항목 중 결제 상태 `PAID`이고 아직 그 상품에 후기를 안 쓴 것으로, 상품 단위라 같은 상품을 두 번 샀으면 한 번만 온다. 후기를 등록하면 `useMutateCreateReview`가 `review.myAll` 키를 비워 이 목록에서 빠진다.

**시안과 다른 두 곳.** "구매일" 자리에는 응답의 `confirmedAt`(구매확정 시각)이 와서 라벨을 **구매확정일**로 둔다. "후기 작성 N일 남음"은 백엔드에 작성 기한 개념이 없어(`createReview`는 구매확정만 본다) 그리지 않는다. 둘 다 PD 확인 항목이다.

탭을 열 때만 그 탭의 목록을 부른다. 한 탭에 머무는 동안 다른 탭의 요청을 미리 보내지 않는다.
