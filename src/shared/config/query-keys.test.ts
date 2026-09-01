// Query Key factory 단위 테스트. 하위 루트 펼침 계층과 도메인 루트 분리를 검증한다.
import { describe, expect, it } from "vitest";

import { QUERY_KEYS } from "./query-keys";

describe("QUERY_KEYS", () => {
  it("개별 factory는 하위 루트 factory를 펼쳐 계층을 맞춘다", () => {
    expect(QUERY_KEYS.product.list({ category: "feed" })).toEqual([
      ...QUERY_KEYS.product.listAll(),
      { category: "feed" },
    ]);
    expect(QUERY_KEYS.product.detail(1)).toEqual([...QUERY_KEYS.product.detailAll(), 1]);
    expect(QUERY_KEYS.review.myDetail(2)).toEqual([...QUERY_KEYS.review.myAll(), "detail", 2]);
  });

  it("모든 factory는 도메인 all 루트에서 시작한다", () => {
    expect(QUERY_KEYS.timedeal.detail(1).slice(0, 1)).toEqual(QUERY_KEYS.timedeal.all);
    expect(QUERY_KEYS.notification.unreadCount().slice(0, 1)).toEqual(QUERY_KEYS.notification.all);
  });

  it("도메인 루트는 서로 겹치지 않는다", () => {
    const roots = Object.values(QUERY_KEYS).map((domain) => domain.all[0]);
    expect(new Set(roots).size).toBe(roots.length);
  });
});
