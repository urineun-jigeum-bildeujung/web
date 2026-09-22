# entities/review

상품에 달린 후기. 누가 어떤 아이와 함께 썼는지를 함께 보여준다.

| 파일 | 설명 |
| --- | --- |
| `ui/review-card.tsx` | 리뷰 한 장. 작성자·아이 프로필·별점·사진·옵션·사용 기간 칩·본문·신고·도움돼요 |
| `ui/review-card.test.tsx` | 아이 프로필과 칩이 읽히는지, 도움돼요가 눌리는지 본다 |
| `model/mock-reviews.ts` | 리뷰 목데이터·정렬 목록·사진 달린 후기 |
| `api/reviews.ts` | 리뷰 등록·리뷰 사진 발급·내 후기 목록·작성 가능한 상품 목록 조회와 `ReviewCreateRequest`·`MyReviewItem`·`WritableReview` 타입 |
| `api/reviews.test.ts` | 무엇을 부르는지, 응답을 화면 모양으로 옮기는 것 |
| `api/use-mutate-create-review.ts` | 사진을 올린 뒤 등록하는 훅. 성공하면 내 후기·상품 리뷰 캐시를 비운다 |
| `api/use-query-my-reviews.ts` | 내가 쓴 후기 첫 쪽을 받는 훅 |
| `api/use-query-writable-reviews.ts` | 구매확정했는데 아직 후기를 안 쓴 상품 목록을 받는 훅 |
| `api/feedbacks.ts` | 구매 후 상태 체크(반응). 남길 수 있는 항목 조회와 등록(답변·보류), `PendingFeedback`·`FeedbackSubmission` 타입 |
| `api/feedbacks.test.ts` | 응답 옮기기, 답변과 보류가 어떻게 실리는지 |
| `api/use-query-pending-feedbacks.ts` | 남길 수 있는 항목을 받는 훅 |
| `api/use-mutate-submit-feedback.ts` | 반응을 등록하는 훅. 성공하면 남길 수 있는 목록을 비운다 |
| `index.ts` | 공개 API |

## 왜 별점만 두지 않았나

같은 사료라도 4kg 말티즈와 30kg 리트리버의 후기는 다른 이야기다. 별점만 나열하면 그 차이가 사라져, 보호자가 자기 아이에게 적용할 수 있는지 판단할 수 없다. 품종·나이·체중을 이름 바로 아래에 두는 이유다.

## 아직 없는 것

- 사진은 받을 곳이 없어 몇 장인지만 알고 자리를 잡는다
- 도움돼요와 신고는 보낼 곳이 없다. 화면 상태로만 반응하고 API 계약이 정해지면 잇는다
