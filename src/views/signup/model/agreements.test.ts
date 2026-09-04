// 전체 동의가 하위를 한꺼번에 다루는지, 필수를 다 채워야 넘어가는지 본다.
import { describe, expect, it } from "vitest";

import { canProceed, isAllChecked, OPTIONAL_IDS, REQUIRED_IDS, toggleGroup } from "./agreements";

describe("isAllChecked", () => {
  it("묶음이 전부 들어 있어야 참이다", () => {
    expect(isAllChecked(REQUIRED_IDS, REQUIRED_IDS)).toBe(true);
  });

  it("하나라도 빠지면 거짓이다", () => {
    expect(isAllChecked(REQUIRED_IDS.slice(1), REQUIRED_IDS)).toBe(false);
  });

  it("빈 묶음은 참이 아니다", () => {
    // 항목이 없는데 전체 동의가 켜져 보이면 안 된다
    expect(isAllChecked([], [])).toBe(false);
  });
});

describe("toggleGroup", () => {
  it("켜면 묶음이 한꺼번에 들어온다", () => {
    const next = toggleGroup([], REQUIRED_IDS, true);
    expect(REQUIRED_IDS.every((id) => next.includes(id))).toBe(true);
  });

  it("이미 들어 있는 것을 두 번 넣지 않는다", () => {
    const once = toggleGroup([], REQUIRED_IDS, true);
    const twice = toggleGroup(once, REQUIRED_IDS, true);
    expect(twice).toHaveLength(REQUIRED_IDS.length);
  });

  it("끄면 그 묶음만 빠지고 나머지는 남는다", () => {
    const all = toggleGroup(toggleGroup([], REQUIRED_IDS, true), OPTIONAL_IDS, true);
    const next = toggleGroup(all, OPTIONAL_IDS, false);

    expect(REQUIRED_IDS.every((id) => next.includes(id))).toBe(true);
    expect(OPTIONAL_IDS.some((id) => next.includes(id))).toBe(false);
  });
});

describe("canProceed", () => {
  it("필수를 다 채우면 넘어갈 수 있다", () => {
    expect(canProceed(REQUIRED_IDS)).toBe(true);
  });

  it("선택만 채우면 넘어갈 수 없다", () => {
    expect(canProceed(OPTIONAL_IDS)).toBe(false);
  });

  it("필수 하나가 빠지면 넘어갈 수 없다", () => {
    expect(canProceed(REQUIRED_IDS.slice(1))).toBe(false);
  });
});
