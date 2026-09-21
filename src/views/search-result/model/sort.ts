// 검색 결과 정렬 값. 서버 페이지(page.tsx)와 클라이언트 화면(search-result-view.tsx)이
// 함께 쓰는데, 뷰 파일은 "use client"라 순수 상수를 내보내도 서버 쪽에서는 실제 값을
// 받지 못한다("use client" 경계를 넘는 건 컴포넌트 참조뿐이다) — 그래서 이 파일은
// 어느 쪽에도 속하지 않는 중립 위치에 둔다.

import type { ProductSort } from "@/entities/product";

/** IA의 검색 결과 행에 적힌 목록. 메인의 정렬과 달라 여기 따로 둔다 */
export const SORTS = ["recommend", "popular", "price-low", "price-high", "reviews"] as const;
export type ResultSort = (typeof SORTS)[number];

export const SORT_LABEL: Record<ResultSort, string> = {
  recommend: "추천순",
  popular: "인기순",
  "price-low": "낮은 가격순",
  "price-high": "높은 가격순",
  reviews: "리뷰 많은순",
};

/** 화면 정렬 값 → 백엔드 `ProductSort`. 서버가 실제로 거르고 정렬해 준다(#282) —
 *  화면에 클라이언트 재정렬 로직을 따로 두지 않는다 */
export const SORT_TO_API: Record<ResultSort, ProductSort> = {
  recommend: "RECOMMEND",
  popular: "POPULAR",
  "price-low": "PRICE_ASC",
  "price-high": "PRICE_DESC",
  reviews: "REVIEW",
};
