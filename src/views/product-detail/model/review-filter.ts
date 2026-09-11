// 리뷰를 거르는 조건과 그 조건이 무엇을 뜻하는지 풀어 쓰는 규칙.
// 와이어프레임 기준(상품 상세_리뷰 필터 바텀시트)이라 디자인 확정 시 바뀔 수 있다.
//
// 시안이 슬라이더 아래에 "8세 이상 (노령견)"처럼 뜻을 함께 적는다. 숫자만 보이면
// 무엇을 고른 것인지 알기 어려워서다. 그 문구를 만드는 자리가 이 파일이다.

import type { MockReview } from "./mock-reviews";

/** 슬라이더 양 끝. 오른쪽 끝은 "그 이상"을 뜻한다 */
export const PERIOD_RANGE = [1, 9] as const;
export const AGE_RANGE = [0, 15] as const;
export const WEIGHT_RANGE = [1, 30] as const;

export type Species = "dog" | "cat";
export type Neutered = "yes" | "no";

export type ReviewFilter = {
  /** 쓴 기간(개월) */
  period: [number, number];
  /** 재구매한 사람의 후기만 */
  repeatOnly: boolean;
  species: Species | null;
  /** 나이(세) */
  age: [number, number];
  neutered: Neutered | null;
  /** 체중(kg) */
  weight: [number, number];
};

export const DEFAULT_FILTER: ReviewFilter = {
  period: [...PERIOD_RANGE],
  repeatOnly: false,
  species: null,
  age: [...AGE_RANGE],
  neutered: null,
  weight: [...WEIGHT_RANGE],
};

/** 양 끝 그대로면 고르지 않은 것과 같다 */
function untouched(value: [number, number], range: readonly [number, number]) {
  return value[0] === range[0] && value[1] === range[1];
}

export function isDefault(filter: ReviewFilter) {
  return (
    untouched(filter.period, PERIOD_RANGE) &&
    !filter.repeatOnly &&
    filter.species === null &&
    untouched(filter.age, AGE_RANGE) &&
    filter.neutered === null &&
    untouched(filter.weight, WEIGHT_RANGE)
  );
}

/**
 * 고른 구간을 사람이 읽는 문장으로. 오른쪽 끝까지 열려 있으면 "이상"이고,
 * 양 끝을 건드리지 않았으면 아무 말도 하지 않는다.
 */
function rangeLabel(
  value: [number, number],
  range: readonly [number, number],
  unit: string,
  note?: (value: [number, number]) => string | null,
) {
  if (untouched(value, range)) return null;

  const [min, max] = value;
  const body =
    max === range[1]
      ? `${min}${unit} 이상`
      : min === range[0]
        ? `${max}${unit} 이하`
        : `${min}${unit} - ${max}${unit}`;
  const extra = note?.(value);

  return extra ? `${body} (${extra})` : body;
}

/** 나이 구간에 이름을 붙인다. 숫자만으로는 무엇을 고른 것인지 읽히지 않는다 */
function ageNote([min]: [number, number]) {
  if (min >= 8) return "노령견";
  if (min >= 2) return "성견";
  return null;
}

export function periodLabel(filter: ReviewFilter) {
  // 시안은 "3개월 이상 사용"이라 괄호 없이 뒤에 붙인다
  const base = rangeLabel(filter.period, PERIOD_RANGE, "개월");
  return base ? `${base} 사용` : null;
}

export function ageLabel(filter: ReviewFilter) {
  return rangeLabel(filter.age, AGE_RANGE, "세", ageNote);
}

export function weightLabel(filter: ReviewFilter) {
  return rangeLabel(filter.weight, WEIGHT_RANGE, "kg");
}

/**
 * 조건에 맞는 후기만 남긴다.
 *
 * 실제로는 조건을 요청 파라미터로 넘겨 서버가 걸러 준다. 목업 단계라 여기서 거르고,
 * 연동하면 이 함수는 통째로 사라진다.
 */
export function applyFilter(reviews: MockReview[], filter: ReviewFilter) {
  /**
   * 양 끝 그대로면 아예 재지 않는다. 슬라이더 왼쪽 끝이 1개월이라 그대로 걸러 버리면
   * 아무것도 고르지 않았는데 3주차 후기가 사라진다.
   *
   * 오른쪽 끝은 "그 이상"이라 위쪽을 막지 않는다.
   */
  const inRange = (value: number, picked: [number, number], range: readonly [number, number]) =>
    untouched(picked, range) ||
    (value >= picked[0] && (picked[1] === range[1] || value <= picked[1]));

  return reviews.filter((review) => {
    return (
      inRange(review.usedMonths, filter.period, PERIOD_RANGE) &&
      inRange(review.age, filter.age, AGE_RANGE) &&
      inRange(review.weight, filter.weight, WEIGHT_RANGE) &&
      (!filter.repeatOnly || review.repeatCount > 0) &&
      (filter.species === null || review.species === filter.species) &&
      (filter.neutered === null || review.neutered === (filter.neutered === "yes"))
    );
  });
}

/**
 * 조건을 주소 한 칸에 싣는다. 여섯 가지를 키마다 나누면 주소가 길어져,
 * 기본값과 다른 것만 모아 `period:3-9|species:dog` 꼴로 적는다.
 */
export function serializeFilter(filter: ReviewFilter) {
  const parts: string[] = [];

  if (!untouched(filter.period, PERIOD_RANGE)) parts.push(`period:${filter.period.join("-")}`);
  if (filter.repeatOnly) parts.push("repeat:1");
  if (filter.species) parts.push(`species:${filter.species}`);
  if (!untouched(filter.age, AGE_RANGE)) parts.push(`age:${filter.age.join("-")}`);
  if (filter.neutered) parts.push(`neutered:${filter.neutered}`);
  if (!untouched(filter.weight, WEIGHT_RANGE)) parts.push(`weight:${filter.weight.join("-")}`);

  return parts.join("|");
}

/** 주소는 사람이 고칠 수 있다. 범위를 벗어나거나 숫자가 아니면 기본값으로 되돌린다 */
function parseRange(raw: string | undefined, range: readonly [number, number]): [number, number] {
  if (!raw) return [range[0], range[1]];

  const [first, second] = raw.split("-").map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return [range[0], range[1]];

  return [Math.max(range[0], Math.min(first, second)), Math.min(range[1], Math.max(first, second))];
}

export function parseFilter(param: string): ReviewFilter {
  const entries = new Map(
    param
      .split("|")
      .filter(Boolean)
      .map((part) => {
        const at = part.indexOf(":");
        return [part.slice(0, at), part.slice(at + 1)] as const;
      }),
  );

  const species = entries.get("species");
  const neutered = entries.get("neutered");

  return {
    period: parseRange(entries.get("period"), PERIOD_RANGE),
    repeatOnly: entries.get("repeat") === "1",
    species: species === "dog" || species === "cat" ? species : null,
    age: parseRange(entries.get("age"), AGE_RANGE),
    neutered: neutered === "yes" || neutered === "no" ? neutered : null,
    weight: parseRange(entries.get("weight"), WEIGHT_RANGE),
  };
}
