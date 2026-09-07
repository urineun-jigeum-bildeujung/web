// 질환 갈래가 종별로 갈리는지 본다. 섞이면 "우리 아이 기준"이라는 전제가 무너진다.
import { describe, expect, test } from "vitest";

import { CONCERN_GROUPS } from "./health";

const labels = (species: "dog" | "cat") => CONCERN_GROUPS[species].map((group) => group.label);
const items = (species: "dog" | "cat") => CONCERN_GROUPS[species].flatMap((group) => group.items);

describe("CONCERN_GROUPS", () => {
  test("기능명세서 v0.4의 갈래 수와 맞는다", () => {
    expect(CONCERN_GROUPS.dog).toHaveLength(11);
    expect(CONCERN_GROUPS.cat).toHaveLength(12);
  });

  test("한쪽에만 있는 갈래가 있다", () => {
    expect(labels("dog")).toContain("호흡기");
    expect(labels("cat")).not.toContain("호흡기");

    expect(labels("cat")).toContain("스트레스 행동");
    expect(labels("dog")).not.toContain("스트레스 행동");
  });

  // 고양이에게 십자인대 질환을, 강아지에게 헤어볼을 보이면 안 된다
  test("종에 없는 항목이 섞이지 않는다", () => {
    expect(items("dog")).toContain("십자인대 질환");
    expect(items("cat")).not.toContain("십자인대 질환");

    expect(items("cat")).toContain("헤어볼");
    expect(items("dog")).not.toContain("헤어볼");
  });

  test("갈래 안에서 같은 항목이 두 번 나오지 않는다", () => {
    for (const species of ["dog", "cat"] as const) {
      const all = items(species);
      expect(new Set(all).size, `${species}에 중복이 있다`).toBe(all.length);
    }
  });

  test("빈 갈래를 두지 않는다", () => {
    for (const species of ["dog", "cat"] as const) {
      for (const group of CONCERN_GROUPS[species]) {
        expect(group.items.length, `${group.label}이 비어 있다`).toBeGreaterThan(0);
      }
    }
  });
});
