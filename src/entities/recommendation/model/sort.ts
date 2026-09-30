// 추천 목록의 정렬. 추천순은 서버 순서 그대로이고, 나머지는 받은 목록 안에서 다시 늘어놓는다.
//
// **서버에서 할 수 있는 건 서버로(AGENTS 2.5)의 예외다.** 추천 API(v3.0.0)의 `sort`는 추천순 하나뿐이라
// 최신순·별점순을 요청할 방법이 없다. 그래서 받을 수 있는 만큼(50개) 받아 FE가 정렬한다(#600).

import type { Recommendation } from "./recommendation";

/** 주소(`?sort=`)에 담는 값. 첫 값이 기본이다 */
export const RECOMMENDATION_SORTS = ["recommend", "latest", "rating-high", "rating-low"] as const;
export type RecommendationSort = (typeof RECOMMENDATION_SORTS)[number];

/** 새 배열로 돌려준다. 같은 값끼리는 추천 순서(`rank`)를 지킨다 */
export function sortRecommendations(
  items: readonly Recommendation[],
  sort: RecommendationSort,
): Recommendation[] {
  const byRank = [...items].sort((a, b) => a.rank - b.rank);
  switch (sort) {
    case "latest":
      return byRank.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case "rating-high":
      return byRank.sort((a, b) => b.rating - a.rating);
    case "rating-low":
      return byRank.sort((a, b) => a.rating - b.rating);
    case "recommend":
      return byRank;
  }
}
