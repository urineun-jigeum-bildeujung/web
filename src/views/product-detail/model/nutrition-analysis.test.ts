// 실제 성분값과 기준 경계, 미확인 성분의 표시 여부를 검증한다.
import { expect, test } from "vitest";
import { toNutritionBars, type NutritionItem } from "./nutrition-analysis";

const item: NutritionItem = {
  nutrient_code: "CRUDE_PROTEIN",
  value: 30,
  unit: "PERCENT",
  nias_min: 18,
  nias_max: 50,
};

test("실제 값과 기준 경계를 같은 막대에 옮긴다", () => {
  const [bar] = toNutritionBars([item]);
  expect(bar.name).toBe("단백질");
  expect(bar.valueLabel).toBe("30%");
  expect(bar.position).toBeCloseTo(1 / 3 + 12 / 32 / 3);
  expect(bar.properRange).toEqual([1 / 3, 2 / 3]);
  expect(toNutritionBars([{ ...item, value: 18 }])[0].position).toBe(1 / 3);
  expect(toNutritionBars([{ ...item, value: 50 }])[0].position).toBe(2 / 3);
  expect(toNutritionBars([{ ...item, value: 9 }])[0].position).toBe(1 / 6);
  expect(toNutritionBars([{ ...item, value: 100 }])[0].position).toBe(1);
});

test("최소가 0이어도 적정 경계를 유지한다", () => {
  expect(toNutritionBars([{ ...item, value: 0, nias_min: 0 }])[0].position).toBe(1 / 3);
});

test("알 수 없는 코드는 첫 기준표 원문 이름만 사용한다", () => {
  expect(toNutritionBars([{ ...item, nutrient_code: "CUSTOM" }])).toEqual([]);
  expect(
    toNutritionBars([
      {
        ...item,
        nutrient_code: "CUSTOM",
        reference_provenance: [
          { source_name_original: null },
          { source_name_original: "뒤의 성분" },
        ],
      },
    ]),
  ).toEqual([]);
  expect(
    toNutritionBars([
      {
        ...item,
        nutrient_code: "CUSTOM",
        reference_provenance: [{ source_name_original: "시험 성분" }],
      },
    ])[0].name,
  ).toBe("시험 성분");
});

test.each([
  { value: null },
  { value: NaN },
  { value: -1 },
  { nias_min: null },
  { nias_max: null },
  { nias_min: -1 },
  { nias_min: 50 },
  { nias_min: 60 },
  { nias_max: Infinity },
  { unit: "" },
])("근거가 없거나 잘못된 값은 막대를 만들지 않는다 %j", (patch) => {
  expect(toNutritionBars([{ ...item, ...patch }])).toEqual([]);
});
