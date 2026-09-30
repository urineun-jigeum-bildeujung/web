// 중앙 Nutrition Safety 응답을 상품 상세의 기존 PetMatch UI 모양으로 옮긴다.
// 실제 score/nutrient 계약이 생기기 전에는 값을 지어내지 않고 비운다.

import type { PetDetail } from "@/entities/pet";

import type { MatchReason, PetMatch } from "./mock-product";
import type { NutritionAnalysis } from "./nutrition-analysis";

type MatchPet = Pick<PetDetail, "id" | "name" | "breedName" | "age" | "weight">;

const NO_CONFLICT_COPY =
  "현재 등록 정보와 확인 가능한 상품 정보 기준으로 충돌이 확인되지 않았습니다.";

function safetyReasons(analysis: NutritionAnalysis): MatchReason[] {
  if (analysis.safety_status === "NO_CONFLICT_DETECTED") {
    return [{ tone: "good", text: NO_CONFLICT_COPY }];
  }

  if (analysis.safety_status === "SAFETY_BLOCKED") {
    return [
      {
        tone: "caution",
        text:
          analysis.safety_message?.trim() ||
          "현재 등록 정보와 상품 정보에서 주의가 필요한 항목이 확인됐습니다.",
      },
    ];
  }

  if (analysis.safety_status === "SAFETY_DATA_INSUFFICIENT") {
    return [
      {
        tone: "caution",
        text: "상품 정보를 충분히 확인할 수 없어 안전 여부를 판단하기 어렵습니다.",
      },
    ];
  }

  if (analysis.safety_status === "NOT_APPLICABLE") {
    return [
      {
        tone: "caution",
        text: "현재 등록 정보 기준으로는 알레르기 충돌 검사를 적용하지 않았습니다.",
      },
    ];
  }

  return [
    {
      tone: "caution",
      text: "현재 상품의 안전성 분석 결과를 충분히 확인하지 못했습니다.",
    },
  ];
}

export function toPetMatch(pet: MatchPet, analysis: NutritionAnalysis): PetMatch {
  return {
    petId: pet.id,
    petName: pet.name,
    score: null,
    profileLabel: `${pet.breedName} · ${pet.age}세 · ${pet.weight}kg`,
    reasons: safetyReasons(analysis),
    nutrients: [],
    functions: "",
    summary: null,
  };
}

export const EMPTY_MATCH_WITHOUT_PET: PetMatch = {
  petId: "",
  petName: "",
  score: null,
  profileLabel: "",
  reasons: [],
  nutrients: [],
  functions: "",
  summary: null,
};
