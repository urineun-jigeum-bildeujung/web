// CATEGORY_TO_API 단위 테스트. 카테고리 매핑이 단순 대문자 변환이 아님을 고정한다.
import { describe, expect, it } from "vitest";

import { CATEGORY_TO_API, CATEGORY_VALUES } from "./category";

describe("CATEGORY_TO_API", () => {
  it("snack은 단순 대문자 변환이 아니라 TREAT로 매핑한다", () => {
    expect(CATEGORY_TO_API.snack).toBe("TREAT");
    expect(CATEGORY_TO_API.food).toBe("FOOD");
    expect(CATEGORY_TO_API.supplement).toBe("SUPPLEMENT");
  });

  it("모든 카테고리 값에 대응하는 API 값이 있다", () => {
    for (const value of CATEGORY_VALUES) {
      expect(CATEGORY_TO_API[value]).toBeDefined();
    }
  });
});
