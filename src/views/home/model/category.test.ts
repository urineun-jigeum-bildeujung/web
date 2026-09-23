// normalizeCategory 단위 테스트. 서버 페이지가 잘못된 쿼리를 그대로 API에 보내지
// 않는지 본다. CATEGORY_TO_API 매핑 테스트는 entities/product로 옮겼다(#390).
import { describe, expect, it } from "vitest";

import { normalizeCategory } from "./category";

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
