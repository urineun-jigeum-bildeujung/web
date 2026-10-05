// 공개 Gateway에서 아이와 상품의 영양 분석을 조회한다.
import { skipToken, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/client";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { toNutritionBars, type NutritionItem } from "../model/nutrition-analysis";

export async function getNutritionAnalysis(petId: number, productId: number) {
  const result = await apiRequest<{ nutrition_items: NutritionItem[] }>(
    "/nutrition/analyze/by-service-id",
    { method: "POST", body: { pet_id: petId, product_id: productId } },
  );
  return toNutritionBars(result.nutrition_items);
}

export function useQueryNutritionAnalysis(petId: number | undefined, productId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.nutrition.analysis(petId ?? "none", productId),
    queryFn: petId === undefined ? skipToken : () => getNutritionAnalysis(petId, productId),
  });
}
