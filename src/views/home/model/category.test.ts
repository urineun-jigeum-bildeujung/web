// normalizeCategory·CATEGORY_TO_API 단위 테스트. 서버 페이지가 잘못된 쿼리를
// 그대로 API에 보내지 않는지, 카테고리 매핑이 맞는지 본다.
import { describe, expect, it } from "vitest";

import { CATEGORY_TO_API, normalizeCategory } from "./category";

describe("normalizeCategory", () => {
  it("유효한 값은 그대로 돌려준다", () => {
    expect(normalizeCategory("food")).toBe("food");
    expect(normalizeCategory("snack")).toBe("snack");
    expect(normalizeCategory("supplement")).toBe("supplement");
  });

  it("잘못된 값이나 없는 값은 all로 정규화한다", () => {
    expect(normalizeCategory(undefined)).toBe("all");
    expect(normalizeCategory("")).toBe("all");
    expect(normalizeCategory("존재하지않는값")).toBe("all");
  });
});

describe("CATEGORY_TO_API", () => {
  it("snack은 단순 대문자 변환이 아니라 TREAT로 매핑한다", () => {
    expect(CATEGORY_TO_API.snack).toBe("TREAT");
    expect(CATEGORY_TO_API.food).toBe("FOOD");
    expect(CATEGORY_TO_API.supplement).toBe("SUPPLEMENT");
  });
});
