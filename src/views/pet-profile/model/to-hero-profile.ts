// 상세 조회로 받은 아이를 사진 카드가 그릴 모양으로 옮긴다.
//
// **서버 값과 화면 값의 모양이 다르다.** 카드는 "말티즈 · 4세 · 여자아이" 한 줄과 "4kg"
// 한 덩이를 받는데 서버는 품종·나이·성별·몸무게를 따로 준다. 옮기는 자리를 화면 안에
// 두면 테스트할 수 없어 여기로 뺐다.

import { BODY_TYPE_OPTIONS, GENDER_OPTIONS, type PetDetail } from "@/entities/pet";

import type { PetHeroProfile } from "../ui/pet-hero-card";

/** 소수점이 없으면 붙이지 않는다. 4.0kg이 아니라 4kg으로 보여야 한다 */
function formatWeight(weight: number): string {
  return `${Number(weight.toFixed(1))}kg`;
}

/**
 * 아이 한 마리를 카드 모양으로 옮긴다.
 *
 * **알레르기는 상세가 준 표시명을 그대로 쓴다.** 저장은 코드로 하지만 상세 응답이
 * `{ code, displayName }`을 함께 주므로 선택지를 따로 받을 일이 없다(#267).
 */
export function toHeroProfile(pet: PetDetail): PetHeroProfile {
  const gender = GENDER_OPTIONS.find((option) => option.value === pet.gender)?.label ?? "";

  return {
    id: pet.id,
    name: pet.name,
    meta: [pet.breedName, `${pet.age}세`, gender].filter(Boolean).join(" · "),
    weight: formatWeight(pet.weight),
    // 서버는 체형을 1부터, 화면 눈금은 0부터 센다
    bodyType: BODY_TYPE_OPTIONS[pet.bcs - 1] ?? "",
    concerns: pet.healthConcerns,
    allergies: pet.allergies.map((item) => item.displayName),
    ...(pet.photoUrl && { photoUrl: pet.photoUrl }),
  };
}
