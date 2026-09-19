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

  it("왼쪽 손잡이만 옮기면 이상으로 읽는다", () => {
    expect(ageLabel(filterWith({ age: [8, 15] }))).toBe("8세 이상");
    expect(periodLabel(filterWith({ period: [3, 12] }))).toBe("3개월 이상 사용");
  });

  it("오른쪽 손잡이만 옮기면 이하로 읽는다", () => {
    expect(periodLabel(filterWith({ period: [1, 6] }))).toBe("6개월 이하 사용");
    expect(ageLabel(filterWith({ age: [0, 8] }))).toBe("8세 이하");
    expect(weightLabel(filterWith({ weight: [1, 5] }))).toBe("5kg 이하");
  });

  it("양쪽을 좁히면 구간으로 읽는다", () => {
    expect(periodLabel(filterWith({ period: [3, 6] }))).toBe("3개월~6개월 사용");
    expect(ageLabel(filterWith({ age: [2, 8] }))).toBe("2세~8세");
    expect(weightLabel(filterWith({ weight: [2, 5] }))).toBe("2kg~5kg");
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

  it("체중 구간을 좁히면 그 밖의 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ weight: [1, 5] }));

    expect(only.every((review) => review.weight <= 5)).toBe(true);
    expect(only.some((review) => review.nickname === "초코집사")).toBe(false);
  });

  it("사용 기한 최소값을 올리면 그 미만 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ period: [3, 12] }));

    expect(only.map((review) => review.nickname).sort()).toEqual(["뭉이언니", "초코집사"]);
  });

  it("사용 기한의 양쪽을 좁히면 구간 밖 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ period: [1, 3] }));
    expect(only.every((review) => review.usedMonths >= 1 && review.usedMonths <= 3)).toBe(true);
  });

  it("나이의 양쪽을 좁히면 구간 밖 후기가 빠진다", () => {
    const only = applyFilter(MOCK_REVIEWS, filterWith({ age: [2, 8] }));
    expect(only.every((review) => review.age >= 2 && review.age <= 8)).toBe(true);
  });
});

describe("주소에 싣고 되읽기", () => {
  it("기본값은 빈 문자열이 된다", () => {
    expect(serializeFilter(DEFAULT_FILTER)).toBe("");
    expect(isDefault(parseFilter(""))).toBe(true);
  });

  it("고른 조건만 실어 되읽어도 같다", () => {
    const filter = filterWith({ species: "dog", age: [2, 8], repeatOnly: true });
    const restored = parseFilter(serializeFilter(filter));

    expect(restored).toEqual(filter);
  });

  it("주소가 망가져 있어도 기본값으로 견딘다", () => {
    const restored = parseFilter("age:abc|species:hamster|weight:99-999|repeat:xyz");

    expect(restored.age).toEqual(DEFAULT_FILTER.age);
    expect(restored.species).toBeNull();
    expect(restored.repeatOnly).toBe(false);
    // 범위를 벗어난 값은 양 끝으로 잘린다
    expect(restored.weight[1]).toBe(30);
  });

  it("거꾸로 적힌 체중 구간도 바로 세운다", () => {
    expect(parseFilter("weight:12-3").weight).toEqual([3, 12]);
  });

  it("기존 단일 손잡이 링크도 같은 최소값의 범위로 읽는다", () => {
    expect(parseFilter("period:3|age:8").period).toEqual([3, 12]);
    expect(parseFilter("period:3|age:8").age).toEqual([8, 15]);
  });
});
