// 링크 이름에 붙일 상품 요약이 첫 상품과 나머지 수로 읽히는지 본다.
import { expect, test } from "vitest";

import { summarizeItems } from "./item-summary";

test("상품이 하나면 그 이름이다", () => {
  expect(summarizeItems([{ productName: "사료" }])).toBe("사료");
});

test("여럿이면 첫 상품과 나머지 수다", () => {
  expect(
    summarizeItems([{ productName: "사료" }, { productName: "간식" }, { productName: "껌" }]),
  ).toBe("사료 외 2건");
});

test("상품이 없으면 빈 문자열이다", () => {
  expect(summarizeItems([])).toBe("");
});
