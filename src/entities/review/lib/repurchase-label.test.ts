// 재구매 칩 문구. 0회면 칩이 없다.

import { describe, expect, it } from "vitest";

import { toRepurchaseLabels } from "./repurchase-label";

describe("toRepurchaseLabels", () => {
  it("한 번 이상이면 횟수를 적는다", () => {
    expect(toRepurchaseLabels(1)).toEqual(["재구매 1회"]);
    expect(toRepurchaseLabels(2)).toEqual(["재구매 2회"]);
  });

  it("0회면 칩을 두지 않는다", () => {
    expect(toRepurchaseLabels(0)).toEqual([]);
  });
});
