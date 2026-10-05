// 영양 분석의 요청 계약과 아이별 캐시 분리를 검증한다.
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";
import { getNutritionAnalysis, useQueryNutritionAnalysis } from "./nutrition-analysis";

afterEach(() => vi.unstubAllGlobals());

test("상태를 임의로 덮어쓰지 않고 아이·상품 ID로 분석한다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ nutrition_items: [] }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getNutritionAnalysis(3, 141)).toEqual([]);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/nutrition/analyze/by-service-id");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ pet_id: 3, product_id: 141 });
});

test("아이를 모르거나 로그인 전이면 분석을 호출하지 않는다", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderHook(() => useQueryNutritionAnalysis(undefined, 141), { wrapper: createQueryWrapper() });
  expect(fetchMock).not.toHaveBeenCalled();
});

test("아이를 바꾼 뒤에는 앞 아이의 성분을 새 아이에게 보여주지 않는다", async () => {
  const fetchMock = vi.fn().mockImplementation((_url, init) => {
    const id = JSON.parse(init.body).pet_id;
    if (id === 7) return new Promise(() => {});
    return Promise.resolve(
      Response.json({
        nutrition_items: [
          {
            nutrient_code: "CRUDE_PROTEIN",
            value: 30,
            unit: "PERCENT",
            nias_min: 18,
            nias_max: 50,
          },
        ],
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  const view = renderHook(({ petId }) => useQueryNutritionAnalysis(petId, 141), {
    initialProps: { petId: 3 },
    wrapper: createQueryWrapper(),
  });
  await waitFor(() => expect(view.result.current.data?.[0].valueLabel).toBe("30%"));
  view.rerender({ petId: 7 });
  expect(view.result.current.data).toBeUndefined();
  expect(view.result.current.isLoading).toBe(true);
});
