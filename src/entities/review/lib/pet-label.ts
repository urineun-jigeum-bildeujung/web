// 후기를 쓴 아이를 카드 한 줄로 옮긴다.
//
// 품종명(`breedName`)으로 적는다. 같은 사료를 먹인 아이가 우리 아이와 같은 품종인지가
// 후기를 읽을 때의 판단 근거라, 체구까지만 적으면 소형견 전부가 한 덩어리가 된다.
//
// 품종명 스냅샷은 뒤늦게 생겨 그 전에 쓴 후기는 비어 있다. 그때는 예전처럼 체구로 적고,
// 체구(`breedSize`)도 없는 고양이는 종으로 적는다.

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

/** 아이 한 마리를 `말티즈 · 8세 · 4kg`로 적는다. 품종명이 없으면 체구로, 그것도 없으면 종으로 */
export function formatPetProfile(pet: ReviewPet): string {
  // 빈 문자열·공백도 이름이 없는 것으로 친다. 그대로 쓰면 앞이 빈 " · 8세 · 4kg"가 된다 —
  // 같은 응답의 `nickname`이 조회가 비면 빈 문자열로 오고, 컬럼의 NOT NULL은 빈 값을 막지 않는다
  const breedName = pet.breedName?.trim();
  const kind =
    breedName || (pet.breedSize ? BREED_SIZE_LABEL[pet.breedSize] : SPECIES_LABEL[pet.species]);

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
