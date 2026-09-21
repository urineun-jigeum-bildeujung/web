// 리뷰를 거르는 조건과 그 조건이 무엇을 뜻하는지 풀어 쓰는 규칙.
// UI 시안 기준(상품 상세_리뷰 필터 바텀시트 1·2, 1716-46878·1755-53110)이다.
//
// 시안이 슬라이더 아래에 "8세 이상 (노령견)"처럼 뜻을 함께 적는다. 숫자만 보이면
// 무엇을 고른 것인지 알기 어려워서다. 그 문구를 만드는 자리가 이 파일이다.
//
// 사용 기한·나이·체중 모두 두 손잡이로 구간을 고른다(PD팀 확인).

import type { MockReview } from "@/entities/review";

/** 슬라이더 오른쪽 끝은 1년+/15세+/30kg+로 열린 상한을 뜻한다 */
export const PERIOD_RANGE = [1, 12] as const;
export const AGE_RANGE = [0, 15] as const;
export const WEIGHT_RANGE = [1, 30] as const;

export type Species = "dog" | "cat";
export type Neutered = "yes" | "no";

export type ReviewFilter = {
  /** 사용 기간 구간(개월) */
  period: [number, number];
  /** 재구매한 사람의 후기만 */
  repeatOnly: boolean;
  species: Species | null;
  /** 골라 둔 품종 id들(#264). `GET /pets/breeds`가 준 id 그대로다 */
  breedIds: number[];
  /** 나이 구간(세) */
  age: [number, number];
  neutered: Neutered | null;
  /** 체중 구간(kg) */
  weight: [number, number];
  /** 골라 둔 건강 관심사 값들(#264). `GET /pets/health-options` items 값 그대로다 */
  healthConcerns: string[];
};

export const DEFAULT_FILTER: ReviewFilter = {
  period: [...PERIOD_RANGE],
  repeatOnly: false,
  species: null,
  breedIds: [],
  age: [...AGE_RANGE],
  neutered: null,
  weight: [...WEIGHT_RANGE],
  healthConcerns: [],
};

/** 양 끝 그대로면 고르지 않은 것과 같다 */
function untouchedRange(value: [number, number], range: readonly [number, number]) {
  return value[0] === range[0] && value[1] === range[1];
}

export function isDefault(filter: ReviewFilter) {
  return (
    untouchedRange(filter.period, PERIOD_RANGE) &&
    !filter.repeatOnly &&
    filter.species === null &&
    filter.breedIds.length === 0 &&
    untouchedRange(filter.age, AGE_RANGE) &&
    filter.neutered === null &&
    untouchedRange(filter.weight, WEIGHT_RANGE) &&
    filter.healthConcerns.length === 0
  );
}

/** 선택한 양 끝의 의미를 문장으로 보여준다. 오른쪽 끝은 열린 상한이다 */
function rangeLabel(value: [number, number], range: readonly [number, number], unit: string) {
  if (untouchedRange(value, range)) return null;
  const [min, max] = value;
  if (max === range[1]) return `${min}${unit} 이상`;
  if (min === range[0]) return `${max}${unit} 이하`;
  return `${min}${unit}~${max}${unit}`;
}

export function periodLabel(filter: ReviewFilter) {
  const base = rangeLabel(filter.period, PERIOD_RANGE, "개월");
  return base ? `${base} 사용` : null;
}

export function ageLabel(filter: ReviewFilter) {
  return rangeLabel(filter.age, AGE_RANGE, "세");
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
  // 양 끝을 건드리지 않았으면 범위 밖 목업 데이터도 그대로 둔다(예: 사용 3주차).
  const inRange = (value: number, picked: [number, number], range: readonly [number, number]) =>
    untouchedRange(picked, range) ||
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
 * 조건을 주소 한 칸에 싣는다. 여덟 가지를 키마다 나누면 주소가 길어져,
 * 기본값과 다른 것만 모아 `period:3-6|weight:1-9` 꼴로 적는다.
 */
export function serializeFilter(filter: ReviewFilter) {
  const parts: string[] = [];

  if (!untouchedRange(filter.period, PERIOD_RANGE)) parts.push(`period:${filter.period.join("-")}`);
  if (filter.repeatOnly) parts.push("repeat:1");
  if (filter.species) parts.push(`species:${filter.species}`);
  if (filter.breedIds.length > 0) parts.push(`breed:${filter.breedIds.join(",")}`);
  if (!untouchedRange(filter.age, AGE_RANGE)) parts.push(`age:${filter.age.join("-")}`);
  if (filter.neutered) parts.push(`neutered:${filter.neutered}`);
  if (!untouchedRange(filter.weight, WEIGHT_RANGE)) parts.push(`weight:${filter.weight.join("-")}`);
  // 건강 관심사는 서버 문자열을 그대로 쓴다(model/health.ts). ","·"|"가 값 안에
  // 섞여 오면 구분자와 겹쳐 되읽기가 깨지므로 각 값을 인코딩해서 싣는다
  if (filter.healthConcerns.length > 0)
    parts.push(`concern:${filter.healthConcerns.map(encodeURIComponent).join(",")}`);

  return parts.join("|");
}

function parseRange(raw: string | undefined, range: readonly [number, number]): [number, number] {
  if (!raw) return [range[0], range[1]];

  const clamp = (value: number) => Math.max(range[0], Math.min(range[1], value));

  // 기존 단일 손잡이 링크(period:3·age:8)는 최소값~열린 상한으로 해석한다.
  if (!raw.includes("-") && Number.isFinite(Number(raw))) {
    return [clamp(Number(raw)), range[1]];
  }

  const [first, second] = raw.split("-").map(Number);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return [range[0], range[1]];

  return [clamp(Math.min(first, second)), clamp(Math.max(first, second))];
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
  const breed = entries.get("breed");
  const concern = entries.get("concern");

  return {
    period: parseRange(entries.get("period"), PERIOD_RANGE),
    repeatOnly: entries.get("repeat") === "1",
    species: species === "dog" || species === "cat" ? species : null,
    breedIds: breed ? breed.split(",").map(Number).filter(Number.isFinite) : [],
    age: parseRange(entries.get("age"), AGE_RANGE),
    neutered: neutered === "yes" || neutered === "no" ? neutered : null,
    weight: parseRange(entries.get("weight"), WEIGHT_RANGE),
    healthConcerns: concern ? concern.split(",").filter(Boolean).map(decodeURIComponent) : [],
  };
}
