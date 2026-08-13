// cn 유틸리티 단위 테스트. 조건부 병합과 Tailwind 클래스 충돌 해소를 검증한다.
import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("조건부 클래스를 병합한다", () => {
    expect(cn("flex", false && "hidden", "gap-2")).toBe("flex gap-2");
  });

  it("충돌하는 Tailwind 클래스는 뒤에 온 것이 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("배열과 객체 형태의 입력도 처리한다", () => {
    expect(cn(["flex", { hidden: false, "gap-2": true }])).toBe("flex gap-2");
  });
});
