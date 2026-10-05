// 영양 분석 응답을 검증해 상품 상세의 성분 막대로 옮긴다.
import type { Nutrient } from "./mock-product";

export type NutritionItem = {
  nutrient_code: string;
  value: number | null;
  unit: string;
  nias_min: number | null;
  nias_max: number | null;
  reference_provenance?: { source_name_original: string | null }[];
};

const NAMES: Record<string, string> = {
  CRUDE_PROTEIN: "단백질",
  CRUDE_FAT: "지방",
  MOISTURE: "수분",
  CALCIUM: "칼슘",
  PHOSPHORUS: "인",
  TAURINE: "타우린",
};

/** 기준 구간을 가운데 삼분의 일로 옮기는 임시 환산. 실제 기준값은 바꾸지 않는다. */
export function toNutritionBars(items: NutritionItem[]): Nutrient[] {
  return items.flatMap((item) => {
    const { value, nias_min: min, nias_max: max } = item;
    const name = NAMES[item.nutrient_code] ?? item.reference_provenance?.[0]?.source_name_original;
    if (
      !name ||
      value === null ||
      min === null ||
      max === null ||
      !Number.isFinite(value) ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      value < 0 ||
      min < 0 ||
      max <= min ||
      !item.unit
    )
      return [];

    const position =
      value < min
        ? value / min / 3
        : value <= max
          ? 1 / 3 + (value - min) / (max - min) / 3
          : Math.min(1, 2 / 3 + (value - max) / (max - min) / 3);
    return [
      {
        name,
        valueLabel: `${value}${item.unit === "PERCENT" ? "%" : ` ${item.unit}`}`,
        position,
        properRange: [1 / 3, 2 / 3] as [number, number],
      },
    ];
  });
}
