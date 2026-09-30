// 상품 상세에서 고른 아이와 상품의 실제 Nutrition Safety 분석을 읽는 훅.
"use client";

import { useQuery } from "@tanstack/react-query";

import { apiRequest, shouldRetryQuery } from "@/shared/api/client";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { NutritionAnalysis } from "../model/nutrition-analysis";

async function getNutritionAnalysis(
  petId: number,
  productId: number,
): Promise<NutritionAnalysis> {
  return apiRequest<NutritionAnalysis>("/nutrition/analyze/by-service-id", {
    method: "POST",
    body: { pet_id: petId, product_id: productId },
  });
}

export function useQueryNutritionAnalysis(petId: string | undefined, productId: number) {
  const numericPetId = Number(petId);
  const enabled =
    Boolean(petId) &&
    Number.isInteger(numericPetId) &&
    numericPetId > 0 &&
    Number.isInteger(productId) &&
    productId > 0;

  const query = useQuery({
    queryKey: QUERY_KEYS.nutrition.analysis(petId ?? "", productId),
    queryFn: () => getNutritionAnalysis(numericPetId, productId),
    enabled,
    retry: shouldRetryQuery,
  });

  return {
    analysis: query.data,
    isLoading: query.isLoading,
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
