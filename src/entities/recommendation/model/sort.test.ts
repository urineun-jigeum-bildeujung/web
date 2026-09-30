// 추천 목록 정렬을 본다. 추천순은 서버 순서 그대로이고 나머지는 받은 목록 안에서 늘어놓는다(#600).
import { describe, expect, it } from "vitest";

import type { Recommendation } from "./recommendation";
import { sortRecommendations } from "./sort";

function item(
  productId: number,
  rank: number,
  rating: number,
  createdAt: string,
  reviewCount = 1,
): Recommendation {
  return {
    productId,
    rank,
    score: 90 - rank,
    reason: "",
    allergyPenalized: false,
    name: `상품 ${productId}`,
    thumbnailUrl: "",
    category: "food",
    price: 10000,
    originalPrice: 10000,
    unitPrice: null,
    rating,
    reviewCount,
    status: "onSale",
    createdAt,
  };
}

// 세 기준이 서로 다른 순서를 내도록 섞는다. 한 방향으로만 움직이면 정렬이 안 돼도 통과한다
const ITEMS = [
  item(30, 3, 4.9, "2026-09-10T00:00:00+00:00"),
  item(10, 1, 4.1, "2026-09-01T00:00:00+00:00"),
  item(20, 2, 4.5, "2026-09-20T00:00:00+00:00"),
];

const ids = (items: Recommendation[]) => items.map((recommendation) => recommendation.productId);

describe("sortRecommendations", () => {
  it("추천순은 서버가 매긴 rank 순서다", () => {
    expect(ids(sortRecommendations(ITEMS, "recommend"))).toEqual([10, 20, 30]);
  });

  it("최신순은 등록일이 늦은 것부터다", () => {
    expect(ids(sortRecommendations(ITEMS, "latest"))).toEqual([20, 30, 10]);
  });

  it("별점 높은순·낮은순", () => {
    expect(ids(sortRecommendations(ITEMS, "rating-high"))).toEqual([30, 20, 10]);
    expect(ids(sortRecommendations(ITEMS, "rating-low"))).toEqual([10, 20, 30]);
  });

  it("별점이 같으면 추천 순서를 지킨다", () => {
    const tied = [item(2, 2, 4.5, "2026-09-01"), item(1, 1, 4.5, "2026-09-01")];
    expect(ids(sortRecommendations(tied, "rating-high"))).toEqual([1, 2]);
  });

  // 후기가 없으면 별점이 0으로 온다. 카드는 "-"로 그리는데 낮은순 맨 앞에 섰다
  it("후기가 없는 상품은 두 별점 정렬 모두 뒤에 온다", () => {
    const withUnrated = [...ITEMS, item(40, 4, 0, "2026-09-05T00:00:00+00:00", 0)];
    expect(ids(sortRecommendations(withUnrated, "rating-high"))).toEqual([30, 20, 10, 40]);
    expect(ids(sortRecommendations(withUnrated, "rating-low"))).toEqual([10, 20, 30, 40]);
  });

  it("받은 배열을 바꾸지 않는다", () => {
    const before = ids(ITEMS);
    sortRecommendations(ITEMS, "latest");
    expect(ids(ITEMS)).toEqual(before);
  });
});
