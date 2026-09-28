# entities/review

상품에 달린 후기. 누가 어떤 아이와 함께 썼는지를 함께 보여준다.

| 파일 | 설명 |
| --- | --- |
| `ui/review-card.tsx` | 리뷰 한 장. 작성자·아이 정보·별점·사진·사용 기간 칩·본문·신고·도움돼요 수 |
| `ui/review-card.test.tsx` | 아이 정보와 칩이 읽히는지, **계약에 없는 닉네임·도움돼요 수를 지어내지 않는지** 본다 |
| `model/review.ts` | 화면이 다루는 `Review` · `ReviewPet`. **`api` · `ui` · `lib`이 모두 이것만 본다** — 세그먼트 사이를 한쪽으로만 흐르게 한다 |
| `model/review-sort.ts` | 정렬 보기와 백엔드 `ReviewSortType` 매핑. 최신순만 이름이 다르다(`recent` ↔ `LATEST`) |
| `lib/pet-label.ts` | 아이를 `소형견 · 8세`로 적는다. 여러 마리면 줄이지 않고 전부 |
| `lib/pet-label.test.ts` | 강아지·고양이·여러 마리·0세 |
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

## 아직 없는 것 (#339)

계약이 부족한 것은 **임시로 지어내지 않고 닫아 둔다.**

- **닉네임과 도움돼요 수는 선택값이다.** 목록 응답에는 오지만 공개 리뷰 상세에는 없다.
  없으면 그 줄을 그리지 않는다 — 임의의 이름을 넣으면 진짜 후기 글에 다른 사람의 이름표가 붙고,
  `0`은 "아무도 안 눌렀다"는 다른 사실이 된다
- **도움돼요는 누를 수 없다.** 토글 API는 있지만 목록에 `liked`가 없어, 버튼으로 두면
  어제 누른 후기가 안 누른 상태로 그려지고 누르는 순간 서버가 취소로 처리해 되돌아간다
- **아이 줄이 `소형견 · 8세`까지다.** 응답에 품종명과 몸무게가 없다. 두 값이 오면
  `lib/pet-label`과 매퍼만 넓히면 `말티즈 · 8세 · 4kg`이 된다
- 신고는 보낼 곳이 없다. 계약이 정해지면 잇는다
