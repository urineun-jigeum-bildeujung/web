// 필터 규칙 테스트. 구간 해석과 주소 왕복, 잘못된 주소를 견디는지, 서버 조건으로 옮기는 규칙을 본다.
import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTER,
  ageLabel,
  isDefault,
  parseFilter,
  periodLabel,
  serializeFilter,
  toReviewConditions,
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

describe("주소에 싣고 되읽기", () => {
  it("기본값은 빈 문자열이 된다", () => {
    expect(serializeFilter(DEFAULT_FILTER)).toBe("");
    expect(isDefault(parseFilter(""))).toBe(true);
  });

  it("고른 조건만 실어 되읽어도 같다", () => {
    const filter = filterWith({ species: "dog", age: [2, 8] });
    const restored = parseFilter(serializeFilter(filter));

    expect(restored).toEqual(filter);
  });

  it("품종·건강 관심사도 실어 되읽어도 같다(#264)", () => {
    const filter = filterWith({
      breedIds: [12, 45],
      healthConcerns: ["근육량 감소", "슬개골 탈구"],
    });
    const restored = parseFilter(serializeFilter(filter));

    expect(restored).toEqual(filter);
    expect(isDefault(filter)).toBe(false);
  });

  it("건강 관심사 값에 ,·|가 섞여 있어도 되읽으면 같다(코드래빗 리뷰)", () => {
    const filter = filterWith({
      healthConcerns: ["관절, 근육 통증", "심장|면역"],
    });
    const restored = parseFilter(serializeFilter(filter));

    expect(restored).toEqual(filter);
  });

  it("주소가 망가져 있어도 기본값으로 견딘다", () => {
    const restored = parseFilter("age:abc|species:hamster|weight:99-999|repeat:xyz");

    expect(restored.age).toEqual(DEFAULT_FILTER.age);
    expect(restored.species).toBeNull();
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

  // "재구매 여부만 보기"가 MVP에서 빠지기 전에 공유된 주소가 남아 있을 수 있다.
  // `parseFilter`는 아는 키만 꺼내 쓰므로 모르는 조각은 조용히 무시된다
  it("걷어낸 조건이 섞인 옛 주소도 아는 조건만 읽는다", () => {
    const restored = parseFilter("period:3-6|repeat:1|weight:1-9");

    expect(restored.period).toEqual([3, 6]);
    expect(restored.weight).toEqual([1, 9]);
    expect(restored).toEqual(filterWith({ period: [3, 6], weight: [1, 9] }));
  });

  it("걷어낸 조건만 남은 옛 주소는 아무것도 고르지 않은 것과 같다", () => {
    expect(isDefault(parseFilter("repeat:1"))).toBe(true);
  });
});

// 서버는 구간 양 끝을 포함하고 일 수로 받는다. 건드리지 않은 손잡이를 보내면 끝에 붙은 값이 빠진다 (#472)
describe("toReviewConditions", () => {
  it("아무것도 고르지 않았으면 조건을 하나도 보내지 않는다", () => {
    expect(toReviewConditions(DEFAULT_FILTER)).toEqual({});
  });

  it("고른 조건을 서버 이름과 값으로 옮긴다", () => {
    expect(
      toReviewConditions(
        filterWith({
          period: [3, 6],
          species: "dog",
          breedIds: [1, 3],
          age: [2, 8],
          neutered: "no",
          weight: [3, 9],
          healthConcerns: ["슬개골 탈구", "관절염"],
        }),
      ),
    ).toEqual({
      usagePeriodMinDays: 90,
      usagePeriodMaxDays: 180,
      species: "DOG",
      breedIds: [1, 3],
      ageMin: 2,
      ageMax: 8,
      neutered: false,
      weightMin: 3,
      weightMax: 9,
      healthConcerns: ["슬개골 탈구", "관절염"],
    });
  });

  it("오른쪽 끝(1년+·15세+·30kg+)은 열린 상한이라 위쪽을 보내지 않는다", () => {
    expect(
      toReviewConditions(filterWith({ period: [6, 12], age: [8, 15], weight: [10, 30] })),
    ).toEqual({ usagePeriodMinDays: 180, ageMin: 8, weightMin: 10 });
  });

  it("왼쪽 끝은 아래 제한이 없는 것이라 아래쪽을 보내지 않는다", () => {
    expect(toReviewConditions(filterWith({ period: [1, 3], age: [0, 3], weight: [1, 5] }))).toEqual(
      { usagePeriodMaxDays: 90, ageMax: 3, weightMax: 5 },
    );
  });

  // 확정한 변환표는 1개월 30일 · 3개월 90일 · 6개월 180일 · 1년 365일이다 (#641)
  it("1년+만 고르면 365일 이상을 보낸다", () => {
    expect(toReviewConditions(filterWith({ period: [12, 12] }))).toEqual({
      usagePeriodMinDays: 365,
    });
  });
});

// 주소는 누구나 고칠 수 있다. 깨진 값 하나에 리뷰 탭 전체가 깨지면 안 된다 (#472 리뷰)
it("건강 관심사 중 풀 수 없는 값만 버리고 나머지 조건은 지킨다", () => {
  const filter = parseFilter(`species:cat|concern:%,${encodeURIComponent("관절염")}`);

  expect(filter.species).toBe("cat");
  expect(filter.healthConcerns).toEqual(["관절염"]);
});
