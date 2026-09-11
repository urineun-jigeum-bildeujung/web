// 필터 규칙 테스트. 구간 해석과 주소 왕복, 잘못된 주소를 견디는지 본다.
import { describe, expect, it } from "vitest";

import { MOCK_REVIEWS } from "@/entities/review";
import {
  DEFAULT_FILTER,
  ageLabel,
  applyFilter,
  isDefault,
  parseFilter,
  periodLabel,
  serializeFilter,
  weightLabel,
  type ReviewFilter,
} from "./review-filter";

function filterWith(part: Partial<ReviewFilter>): ReviewFilter {
  return { ...DEFAULT_FILTER, ...part };
}

describe("구간을 사람이 읽는 문장으로", () => {
  it("건드리지 않은 구간은 아무 말도 하지 않는다", () => {
    expect(periodLabel(DEFAULT_FILTER)).toBeNull();
    expect(ageLabel(DEFAULT_FILTER)).toBeNull();
    expect(weightLabel(DEFAULT_FILTER)).toBeNull();
  });

  // 시안이 "8세 이상 (노령견)"처럼 뜻을 함께 적는다
  it("오른쪽 끝까지 열려 있으면 이상으로 읽는다", () => {
    expect(ageLabel(filterWith({ age: [8, 15] }))).toBe("8세 이상 (노령견)");
    expect(periodLabel(filterWith({ period: [3, 9] }))).toBe("3개월 이상 사용");
  });

  it("위쪽만 좁히면 이하로 읽는다", () => {
    expect(weightLabel(filterWith({ weight: [1, 5] }))).toBe("5kg 이하");
  });

  it("양쪽을 좁히면 구간으로 읽는다", () => {
    expect(weightLabel(filterWith({ weight: [2, 5] }))).toBe("2kg - 5kg");
  });

  it("나이 구간에 이름을 붙인다", () => {
    expect(ageLabel(filterWith({ age: [2, 15] }))).toContain("성견");
    expect(ageLabel(filterWith({ age: [0, 5] }))).not.toContain("성견");
  });
});

describe("조건으로 거르기", () => {
  it("고르지 않았으면 전부 남는다", () => {
    expect(applyFilter(MOCK_REVIEWS, DEFAULT_FILTER)).toHaveLength(MOCK_REVIEWS.length);
  });

  it("종을 고르면 그 종의 후기만 남는다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ species: "cat" }));

    expect(only).toHaveLength(1);
    expect(only[0].nickname).toBe("밤이맘");
  });

  it("재구매만 보기를 켜면 첫 구매 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ repeatOnly: true }));

    expect(only.map((review) => review.nickname).sort()).toEqual(["댕댕이짱", "초코집사"]);
  });

  it("체중을 좁히면 대형견 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ weight: [1, 5] }));

    expect(only.every((review) => review.weight <= 5)).toBe(true);
    expect(only.some((review) => review.nickname === "초코집사")).toBe(false);
  });

  // 오른쪽 끝은 "그 이상"이라 위를 막지 않는다
  it("사용 기간 오른쪽 끝은 위를 막지 않는다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ period: [3, 9] }));

    expect(only.map((review) => review.nickname).sort()).toEqual(["뭉이언니", "초코집사"]);
  });
});

describe("주소에 싣고 되읽기", () => {
  it("기본값은 빈 문자열이 된다", () => {
    expect(serializeFilter(DEFAULT_FILTER)).toBe("");
    expect(isDefault(parseFilter(""))).toBe(true);
  });

  it("고른 조건만 실어 되읽어도 같다", () => {
    const filter = filterWith({ species: "dog", age: [8, 15], repeatOnly: true });
    const restored = parseFilter(serializeFilter(filter));

    expect(restored).toEqual(filter);
  });

  it("주소가 망가져 있어도 기본값으로 견딘다", () => {
    const restored = parseFilter("age:abc-def|species:hamster|weight:99-999|repeat:xyz");

    expect(restored.age).toEqual(DEFAULT_FILTER.age);
    expect(restored.species).toBeNull();
    expect(restored.repeatOnly).toBe(false);
    // 범위를 벗어난 값은 양 끝으로 잘린다
    expect(restored.weight[1]).toBe(30);
  });

  it("거꾸로 적힌 구간도 바로 세운다", () => {
    expect(parseFilter("age:12-3").age).toEqual([3, 12]);
  });
});
