// Query Key factory 단위 테스트. 하위 루트 펼침 계층·도메인 루트 분리·응답을 바꾸는 파라미터 반영을 검증한다.
import { describe, expect, it } from "vitest";

import { QUERY_KEYS } from "./query-keys";

describe("QUERY_KEYS", () => {
  it("개별 factory는 하위 루트 factory를 펼쳐 계층을 맞춘다", () => {
    expect(QUERY_KEYS.product.list({ category: "FOOD", petId: 10, sort: "RECOMMENDED" })).toEqual([
      ...QUERY_KEYS.product.listAll(),
      { category: "FOOD", petId: 10, sort: "RECOMMENDED" },
    ]);
    expect(QUERY_KEYS.product.detail("a1b2")).toEqual([
      ...QUERY_KEYS.product.detailAll(),
      "a1b2",
      { petId: undefined },
    ]);
    expect(QUERY_KEYS.review.detail(2)).toEqual([...QUERY_KEYS.review.detailAll(), 2]);
    expect(QUERY_KEYS.review.myWritable()).toEqual([...QUERY_KEYS.review.myAll(), "writable"]);
  });

  it("아이(petId)에 따라 응답이 달라지는 조회는 키가 서로 다르다", () => {
    expect(QUERY_KEYS.product.detail("a1b2", 10)).not.toEqual(
      QUERY_KEYS.product.detail("a1b2", 20),
    );
    expect(QUERY_KEYS.cart.list(10)).not.toEqual(QUERY_KEYS.cart.list(20));
    expect(QUERY_KEYS.review.byProduct("a1b2", { petId: 10, personalized: true })).not.toEqual(
      QUERY_KEYS.review.byProduct("a1b2"),
    );
  });

  it("모든 factory는 도메인 all 루트에서 시작한다", () => {
    expect(QUERY_KEYS.timedeal.detail(1).slice(0, 1)).toEqual(QUERY_KEYS.timedeal.all);
    expect(QUERY_KEYS.notification.unreadCount().slice(0, 1)).toEqual(QUERY_KEYS.notification.all);
    expect(QUERY_KEYS.catalog.breeds("DOG").slice(0, 1)).toEqual(QUERY_KEYS.catalog.all);
    expect(QUERY_KEYS.user.likes("FOOD").slice(0, 1)).toEqual(QUERY_KEYS.user.all);
  });

  it("도메인 루트는 서로 겹치지 않는다", () => {
    const roots = Object.values(QUERY_KEYS).map((domain) => domain.all[0]);
    expect(new Set(roots).size).toBe(roots.length);
  });
});
