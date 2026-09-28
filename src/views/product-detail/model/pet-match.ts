// 적합도 칸에 그릴 값을 실제 아이로 만든다. 점수·성분 분석은 AI가 붙기 전까지 예시다.
//
// **이름·프로필 줄·알레르기 근거는 실제 값이다.** 예시 아이("소리")를 그리던 동안 내 아이가
// 누구든 남의 이름이 근거 문장에까지 박혀 떴다 (#481). 알레르기는 아이가 등록한 것과 상품
// 원재료의 알레르기를 견준다 — 둘 다 백엔드 공통 `AllergenCode`라 코드로 바로 맞춘다.
//
// **종이 다른 상품은 재지 않는다.** 급여 대상(`targetSpecies`)에 아이의 종이 없으면 점수를
// 매기지 않는다. 고양이에게 강아지 사료 점수를 보이면 근거가 거짓이 된다.

import type { PetDetail } from "@/entities/pet";
import type { ProductDetailInfo } from "@/entities/product";
import { withJosa } from "@/shared/lib/josa/josa";

import { EXAMPLE_ANALYSIS, type MatchReason, type PetMatch } from "./mock-product";

/** 서버는 급여 대상을 한글 표시명으로 준다(`Species.displayName`) */
const SPECIES_LABEL = { dog: "강아지", cat: "고양이" } as const;

type MatchPet = Pick<
  PetDetail,
  "id" | "name" | "species" | "breedName" | "age" | "weight" | "allergies"
>;
type MatchProduct = Pick<ProductDetailInfo, "targetSpecies" | "allergens">;

/**
 * 알레르기 근거. 아이가 등록한 알레르기가 없으면 말하지 않는다 — "없어요"라고 하면 확인한 것처럼
 * 읽히는데, 견줄 것이 없었을 뿐이다.
 */
function allergyReasons(pet: MatchPet, allergens: MatchProduct["allergens"]): MatchReason[] {
  if (pet.allergies.length === 0) {
    return [];
  }
  const registered = new Set(pet.allergies.map((allergy) => allergy.code));
  const hits = allergens.filter((allergen) => registered.has(allergen.code));
  if (hits.length === 0) {
    return [{ tone: "good", text: `${pet.name}에게 등록된 알레르기 유발 성분이 없어요` }];
  }
  const names = hits.map((allergen) => allergen.displayName).join("·");
  return [{ tone: "caution", text: `알레르기로 등록한 ${withJosa(names, "이/가")} 들어 있어요` }];
}

/** 고른 아이 기준의 적합도. 점수·성분은 예시, 이름·프로필·알레르기는 실제 값이다 */
export function toPetMatch(pet: MatchPet, product: MatchProduct): PetMatch {
  const profileLabel = `${pet.breedName} · ${pet.age}세 · ${pet.weight}kg`;
  const species = SPECIES_LABEL[pet.species];

  if (product.targetSpecies.length > 0 && !product.targetSpecies.includes(species)) {
    return {
      petId: pet.id,
      petName: pet.name,
      score: null,
      profileLabel,
      reasons: [
        { tone: "caution", text: `${species} 급여 대상이 아닌 상품이라 아직 재지 못했어요` },
      ],
      nutrients: [],
      functions: EXAMPLE_ANALYSIS.functions,
      summary: null,
    };
  }

  return {
    petId: pet.id,
    petName: pet.name,
    score: EXAMPLE_ANALYSIS.score,
    profileLabel,
    reasons: [
      EXAMPLE_ANALYSIS.goodReason,
      ...allergyReasons(pet, product.allergens),
      EXAMPLE_ANALYSIS.cautionReason,
    ],
    nutrients: EXAMPLE_ANALYSIS.nutrients,
    functions: EXAMPLE_ANALYSIS.functions,
    summary: `${pet.name}에게 꾸준히 급여하기 좋은 상품이에요`,
  };
}

/**
 * 아이를 모를 때(로그인 전) 정보 탭이 쓰는 예시 분석. 아이 이름과 종합 한 줄 없이 성분만 보인다.
 * 적합도 칸은 이때 그리지 않는다 — 아이를 모르는 채로 점수를 보일 수 없다.
 */
export const EXAMPLE_MATCH_WITHOUT_PET: PetMatch = {
  petId: "",
  petName: "",
  score: null,
  profileLabel: "",
  reasons: [],
  nutrients: EXAMPLE_ANALYSIS.nutrients,
  functions: EXAMPLE_ANALYSIS.functions,
  summary: null,
};
