// 후기를 쓴 아이를 카드 한 줄로 옮긴다.
//
// **완성된 문자열을 서버에서 받지 않고 여기서 만든다.** 지금 계약으로는 체구와 나이까지만
// 그릴 수 있는데(`소형견 · 8세`), 품종명과 몸무게가 응답에 들어오면 `말티즈 · 8세 · 4kg`이
// 된다. 그때 고칠 곳이 이 파일 하나로 남도록 값을 구조로 받는다.
//
// 고양이는 체구(`breedSize`)가 없다. 품종명이 오기 전까지는 종으로 적는다.

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

/** 아이 한 마리를 `소형견 · 8세`로 적는다 */
export function formatPetProfile(pet: ReviewPet): string {
  const kind = pet.breedSize ? BREED_SIZE_LABEL[pet.breedSize] : SPECIES_LABEL[pet.species];
  return `${kind} · ${pet.age}세`;
}

/**
 * 함께 먹인 아이들을 한 줄로 적는다.
 *
 * **여러 마리여도 줄이지 않는다.** 첫 마리만 적으면 나머지를 숨기는 것이라 사실과 달라진다.
 * 한 마리 안은 `·`로 잇고 아이끼리는 `,`로 나눠, 어디까지가 한 아이인지 구별된다.
 * 카드 표기를 어떻게 줄일지는 PD 확인 중이다.
 */
export function formatPetProfiles(pets: ReviewPet[]): string {
  return pets.map(formatPetProfile).join(", ");
}
