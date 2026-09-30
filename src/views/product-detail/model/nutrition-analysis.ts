// 상품 상세가 Nutrition runtime 응답에서 소비하는 최소 Safety 계약.
export type NutritionAnalysis = {
  analysis_status?: string;
  safety_status?: string;
  allergy_check_status?: string;
  excluded?: boolean;
  exclude_reasons?: string[];
  warnings?: string[];
  safety_reason_codes?: string[];
  conflicting_allergens?: {
    allergen_code?: string;
    matched_ingredient?: string;
    raw_ingredient?: string;
    normalized_ingredient?: string;
    evidence_source?: string;
    source_version?: string;
    dictionary_version?: string;
  }[];
  safety_message?: string | null;
};
