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

  // 후기를 새로 쓰면 그 상품의 목록·사진·대표 사진을 함께 비워야 한다. 셋이 이 접두사를
  // 공유해야 `invalidateQueries` 한 번으로 걸린다 (#339)
  it("상품별 리뷰 캐시 셋이 byProductAllOf를 접두사로 갖는다", () => {
    const prefix = QUERY_KEYS.review.byProductAllOf("1");

    for (const key of [
      QUERY_KEYS.review.byProduct("1", { sort: "recommend" }),
      QUERY_KEYS.review.byProduct("1", { sort: "recent" }),
      QUERY_KEYS.review.photos("1"),
      QUERY_KEYS.review.featuredPhotos("1"),
    ]) {
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  // 상품이 다르면 접두사도 달라야 남의 상품 캐시까지 비우지 않는다
  it("상품이 다르면 리뷰 캐시 접두사가 다르다", () => {
    expect(QUERY_KEYS.review.byProductAllOf("1")).not.toEqual(
      QUERY_KEYS.review.byProductAllOf("2"),
    );
    // 등록 요청은 숫자, 조회 화면은 문자열로 상품을 든다. 섞이면 키가 어긋나 안 걸린다
    expect(QUERY_KEYS.review.byProductAllOf(1)).not.toEqual(QUERY_KEYS.review.byProductAllOf("1"));
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
