// Nutrition Safety 훅이 pet/product 식별자를 body와 query key에 함께 반영하는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/shared/api/client", () => ({
  apiRequest,
  shouldRetryQuery: () => false,
}));

import { useQueryNutritionAnalysis } from "./use-query-nutrition-analysis";

afterEach(() => apiRequest.mockReset());

test("아이를 모르면 Nutrition 요청을 보내지 않는다", () => {
  const { result } = renderHook(() => useQueryNutritionAnalysis(undefined, 1), {
    wrapper: createQueryWrapper(),
  });

  expect(apiRequest).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
});

test("고른 아이와 상품을 service-id 분석 body로 보낸다", async () => {
  apiRequest.mockResolvedValue({
    safety_status: "NO_CONFLICT_DETECTED",
    excluded: false,
  });

  const { result } = renderHook(() => useQueryNutritionAnalysis("3", 1), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(result.current.analysis).toBeDefined());
  expect(apiRequest).toHaveBeenCalledWith("/nutrition/analyze/by-service-id", {
    method: "POST",
    body: { pet_id: 3, product_id: 1 },
  });
});

test("아이를 바꾸면 새 pet id로 다시 조회한다", async () => {
  apiRequest.mockResolvedValue({
    safety_status: "NO_CONFLICT_DETECTED",
    excluded: false,
  });
  const wrapper = createQueryWrapper();
  const { rerender } = renderHook(({ petId }) => useQueryNutritionAnalysis(petId, 1), {
    wrapper,
    initialProps: { petId: "3" },
  });

  await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
  rerender({ petId: "7" });
  await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2));

  expect(apiRequest).toHaveBeenLastCalledWith("/nutrition/analyze/by-service-id", {
    method: "POST",
    body: { pet_id: 7, product_id: 1 },
  });
});
