// 사용 기간 배지 문구. 일주일 경계에서 날과 주가 갈린다.

import { describe, expect, it } from "vitest";

import { toUsageLabel } from "./usage-label";

describe("toUsageLabel", () => {
  it("일주일이 안 되면 날로 적는다", () => {
    expect(toUsageLabel(1)).toBe("사용 1일째");
    expect(toUsageLabel(6)).toBe("사용 6일째");
  });

  it("일주일부터는 주로 적는다", () => {
    expect(toUsageLabel(7)).toBe("사용 1주째");
    expect(toUsageLabel(21)).toBe("사용 3주째");
  });

  it("주 단위는 내림한다 — 13일은 2주가 아니라 1주째다", () => {
    expect(toUsageLabel(13)).toBe("사용 1주째");
  });
});
