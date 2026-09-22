// 홈 정렬의 URL 값과 API 매핑.
// 같은 views 레이어인 search-result를 참조할 수 없어(FSD) 홈 모델로 따로 둔다.

import type { ProductSort } from "@/entities/product";

export const SORTS = ["recommend", "popular", "price-low", "price-high", "reviews"] as const;
export type HomeSort = (typeof SORTS)[number];

export const SORT_LABEL: Record<HomeSort, string> = {
  recommend: "추천순",
  popular: "인기순",
  "price-low": "낮은 가격순",
  "price-high": "높은 가격순",
  reviews: "리뷰 많은순",
};

/** 화면 정렬 값 → 백엔드 `ProductSort`. 서버가 실제로 거르고 정렬해 준다(#289) */
export const SORT_TO_API: Record<HomeSort, ProductSort> = {
  recommend: "RECOMMEND",
  popular: "POPULAR",
  "price-low": "PRICE_ASC",
  "price-high": "PRICE_DESC",
  reviews: "REVIEW",
};

/** 클라이언트의 `parseAsStringLiteral`만 믿지 않는다. 서버 페이지가 searchParams를
 *  직접 읽을 때도 같은 규칙으로 걸러야 잘못된 값이 그대로 API로 새지 않는다 */
export function normalizeSort(value: string | undefined): HomeSort {
  return (SORTS as readonly string[]).includes(value ?? "") ? (value as HomeSort) : "recommend";
}
