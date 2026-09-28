// 리뷰 정렬 보기와 그 값을 백엔드 열거형으로 옮기는 규칙.
//
// 화면 값과 서버 값의 이름이 하나 다르다 — 최신순은 `recent`인데 서버는 `LATEST`다.
// 주소에 실리는 것은 화면 값이라, 서버로 나갈 때만 이 표를 거친다.

/** 정렬 보기. 주소 쿼리(`reviewSort`)에 이 값이 그대로 실린다 */
export const REVIEW_SORTS = ["recommend", "recent", "rating-high", "rating-low"] as const;

export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const REVIEW_SORT_LABEL: Record<ReviewSort, string> = {
  recommend: "추천순",
  recent: "최신순",
  "rating-high": "별점 높은순",
  "rating-low": "별점 낮은순",
};

/** 백엔드 `ReviewSortType` 값. 서버 요청에만 쓴다 */
const SORT_PARAM: Record<ReviewSort, string> = {
  recommend: "RECOMMEND",
  recent: "LATEST",
  "rating-high": "RATING_HIGH",
  "rating-low": "RATING_LOW",
};

export function toReviewSortParam(sort: ReviewSort): string {
  return SORT_PARAM[sort];
}
