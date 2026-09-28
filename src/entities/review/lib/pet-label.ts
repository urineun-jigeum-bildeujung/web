// 후기를 쓴 아이를 카드 한 줄로 옮긴다.
//
// 품종명은 인증 정책이 정해지기 전까지 연결하지 않아, 체구로 적는다.
// 고양이는 체구(`breedSize`)가 없어 종으로 적는다.

import type { ReviewPet } from "../model/review";

const BREED_SIZE_LABEL: Record<NonNullable<ReviewPet["breedSize"]>, string> = {
  SMALL: "소형견",
  MEDIUM: "중형견",
  LARGE: "대형견",
};

const SPECIES_LABEL: Record<ReviewPet["species"], string> = {
  DOG: "강아지",
  CAT: "고양이",
};

/** `4.0`은 `4`로, `4.25`는 `4.3`으로. 시안이 소수 첫째 자리까지 적는다 */
function formatWeight(kg: number): string {
  return `${Number(kg.toFixed(1))}kg`;
}

/** 아이 한 마리를 `소형견 · 8세 · 4kg`로 적는다. 체구가 없는 고양이는 종으로 적는다 */
export function formatPetProfile(pet: ReviewPet): string {
  const kind = pet.breedSize ? BREED_SIZE_LABEL[pet.breedSize] : SPECIES_LABEL[pet.species];

  return `${kind} · ${pet.age}세 · ${formatWeight(pet.weight)}`;
}

/**
 * 함께 먹인 아이들을 한 줄로 적는다.
 *
 * **여러 마리여도 줄이지 않는다.** 첫 마리만 적으면 나머지를 숨기는 것이라 사실과 달라진다.
 * 한 마리 안은 `·`로 잇고 아이끼리는 `/`로 나눈다.
 */
export function formatPetProfiles(pets: ReviewPet[]): string {
  return pets.map(formatPetProfile).join(" / ");
}
