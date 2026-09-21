// 온보딩 초안을 반려동물 등록 요청으로 옮긴다.
//
// **화면 값과 API 값의 모양이 거의 다 다르다.** 화면은 사람이 고르기 좋은 말로,
// API는 서버가 다루기 좋은 enum과 숫자로 받는다. 옮기는 자리를 화면 안에 두면
// 테스트할 수 없어 여기로 뺐다.

import { parseAge, parseWeight, SPECIES_PARAM, type PetProfileDraft } from "@/entities/pet";
import { parseBirthDate } from "@/shared/lib/birth-date";

/** 백엔드 `PetRegisterRequest`와 같은 모양이다 */
export type PetRegisterRequest = {
  name: string;
  sex: "MALE" | "FEMALE";
  isNeutered: boolean;
  species: "DOG" | "CAT";
  age: number;
  /** `YYYY-MM-DD`. 안 적었으면 보내지 않는다 */
  birthDate?: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
  weight: number;
  /** 체형 1~5 */
  bcs: number;
  breedId: number;
  healthConcerns: string[];
  /** `CHICKEN` 같은 코드다 */
  allergies: string[];
};

const SEX = { male: "MALE", female: "FEMALE" } as const;
const SIZE = { small: "SMALL", medium: "MEDIUM", large: "LARGE" } as const;

/**
 * 초안을 요청으로 옮긴다. 필수 값이 하나라도 비면 `null`이다.
 *
 * **사진은 보내지 않는다.** 요청의 `image`는 URL 문자열인데 파일을 올려 URL을 받는
 * 엔드포인트가 백엔드에 없다. 업로드 방법이 정해지면 이 자리를 채운다(#226).
 *
 * "해당 없음"을 켠 항목은 빈 배열로 보낸다. 안 고른 것과 없다고 답한 것을 서버가
 * 가릴 수는 없지만, 적어도 앞서 골라 둔 것이 남아 흘러가지는 않는다.
 */
export function toRegisterRequest(draft: PetProfileDraft): PetRegisterRequest | null {
  const sex = SEX[draft.gender as keyof typeof SEX];
  const size = SIZE[draft.size as keyof typeof SIZE];
  const age = parseAge(draft.age);
  const weight = parseWeight(draft.weight);
  const birthDate = parseBirthDate(draft.birthday);

  if (!draft.name.trim() || !sex || !size || !draft.neutered || draft.breedId === null) {
    return null;
  }
  if (age === null || weight === null) {
    return null;
  }

  return {
    name: draft.name.trim(),
    sex,
    isNeutered: draft.neutered === "yes",
    species: SPECIES_PARAM[draft.species],
    age,
    ...(birthDate && { birthDate }),
    size,
    weight,
    // 화면 슬라이더는 0부터, API는 1부터 센다
    bcs: draft.bodyTypeIndex + 1,
    breedId: draft.breedId,
    healthConcerns: draft.noConcern ? [] : draft.concern,
    allergies: draft.noAllergy ? [] : draft.allergy,
  };
}
