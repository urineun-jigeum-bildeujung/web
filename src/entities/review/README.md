# entities/review

상품에 달린 후기. 누가 어떤 아이와 함께 썼는지를 함께 보여준다.

| 파일 | 설명 |
| --- | --- |
| `ui/review-card.tsx` | 리뷰 한 장. 아이 원·작성자·아이 정보·별점·사진·사용 기간 칩·본문·신고·도움돼요 수. 아이가 여럿이면 원을 포개고 색은 `shared/lib/avatar`가 아이 id에서 뽑는다 (#488) |
| `ui/review-card.test.tsx` | 아이 정보와 칩이 읽히는지, 아이 원이 수만큼 그려지고 뒤 아이가 아래로 깔리는지, 계약이 없는 상호작용이 붙지 않았는지 본다 |
| `model/review.ts` | 화면이 다루는 `Review` · `ReviewPet`. **`api` · `ui` · `lib`이 모두 이것만 본다** — 세그먼트 사이를 한쪽으로만 흐르게 한다 |
| `model/review-sort.ts` | 정렬 보기와 백엔드 `ReviewSortType` 매핑. 최신순만 이름이 다르다(`recent` ↔ `LATEST`) |
| `lib/pet-label.ts` | 아이를 `소형견 · 8세 · 4kg`로 적는다. 여러 마리면 줄이지 않고 `/`로 |
| `lib/pet-label.test.ts` | 강아지·고양이·여러 마리·몸무게 다듬기·0세 |
| `lib/usage-label.ts` | 일 수를 `사용 3주째`로. 리뷰 상세와 리뷰 탭이 같이 쓴다 |
| `lib/usage-label.test.ts` | 일주일 경계와 주 단위 내림 |
| `api/reviews.ts` | 리뷰 등록·사진 발급·내 후기·작성 가능 목록·리뷰 상세·**상품 후기 목록**·**후기 사진**과 관련 타입 |
| `api/reviews.test.ts` | 무엇을 부르는지, 응답을 화면 모양으로 옮기는 것 |
| `api/use-mutate-create-review.ts` | 사진을 올린 뒤 등록하는 훅. 성공하면 내 후기·상품 리뷰 캐시를 비운다 |
| `api/use-query-my-reviews.ts` | 내가 쓴 후기 첫 쪽을 받는 훅 |
| `api/use-query-writable-reviews.ts` | 구매확정했는데 아직 후기를 안 쓴 상품 목록을 받는 훅 |
| `api/use-query-review-detail.ts` | 리뷰 한 건의 상세를 받는 훅. 사진 뷰어가 카드를 이걸로 채운다 |
| `api/use-query-product-reviews.ts` | 상품 후기 목록을 쪽 단위로 잇는 훅. 응답에 `hasNext`가 없어 `totalCount`로 판단한다 |
| `api/use-query-review-photos.ts` | 후기 사진을 쪽 단위로 잇는 훅. 이쪽은 응답 `hasNext`를 그대로 쓴다 |
| `api/use-query-featured-review-photos.ts` | 리뷰 탭에 거는 대표 사진. 현재 구현은 후기당 한 장씩 넉 장을 준다 |
| `api/use-mutate-create-review.test.tsx` | 등록 뒤 그 상품의 목록·사진·대표 사진이 함께 낡은 것이 되는지, 다른 상품은 건드리지 않는지 |
| `api/feedbacks.ts` | 구매 후 상태 체크(반응). 남길 수 있는 항목 조회와 등록(답변·보류), `PendingFeedback`·`FeedbackSubmission` 타입 |
| `api/feedbacks.test.ts` | 응답 옮기기, 답변과 보류가 어떻게 실리는지 |
| `api/use-query-pending-feedbacks.ts` | 남길 수 있는 항목을 받는 훅 |
| `api/use-mutate-submit-feedback.ts` | 반응을 등록하는 훅. 성공하면 남길 수 있는 목록을 비운다 |
| `index.ts` | 공개 API |

## 왜 별점만 두지 않았나

같은 사료라도 4kg 말티즈와 30kg 리트리버의 후기는 다른 이야기다. 별점만 나열하면 그 차이가 사라져, 보호자가 자기 아이에게 적용할 수 있는지 판단할 수 없다. 품종·나이·체중을 이름 바로 아래에 두는 이유다.

## 아직 없는 것

계약이 부족하거나 정책이 안 정해진 것은 **임시로 지어내지 않고 닫아 둔다.**

- **아이 줄에 품종명이 없다.** 응답에 오는 것은 `breedId`뿐이고 이름은 `GET /pets/breeds`에만
  있는데, **그 조회가 인증을 요구해 비로그인으로 열리는 상품 상세에서 401이 난다.**
  백엔드가 리뷰 응답에 `breedName`을 싣거나 품종 조회가 공개되면 붙인다 — 어느 쪽이든
  고칠 곳은 `lib/pet-label` 하나다
- **도움돼요를 누를 수 없다.** 목록·상세에 `liked`가 실려 첫 상태는 맞출 수 있게 됐지만
  토글(`PATCH /reviews/{id}/recommend`)이 로그인을 요구한다. 비로그인에서 눌렀는데 도로
  꺼지는 모양이 되므로 **비로그인 UX를 정할 때까지 읽기 전용이다**(2026-09-29 검토)
- **재구매 배지를 그릴 수 없다.** 응답에 `repurchaseCount`가 없다. PD가 MVP로 확정해
  (2026-09-28) 백엔드에 요청해 둔 값이다
- 신고는 보낼 곳이 없다. 계약이 정해지면 잇는다
