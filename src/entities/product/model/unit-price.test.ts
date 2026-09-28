// 단가 줄이 시안("1개당 약 680원")과 같은 꼴로 읽히는지 본다.
import { expect, test } from "vitest";

import { formatUnitPrice } from "./unit-price";

// 서버는 기호와 한 단위의 가격을 준다. 기호만 앞에 붙이면 "g 11원"이 된다 (#479)
test("한 단위당 가격으로 읽힌다", () => {
  expect(formatUnitPrice("g", 11)).toBe("1g당 약 11원");
  expect(formatUnitPrice("개", 680)).toBe("1개당 약 680원");
});

test("천 단위에 쉼표를 찍는다", () => {
  expect(formatUnitPrice("ml", 1200)).toBe("1ml당 약 1,200원");
});
