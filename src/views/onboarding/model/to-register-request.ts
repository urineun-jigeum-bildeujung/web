// 온보딩 초안을 반려동물 등록 요청으로 옮긴다.
//
// **화면 값과 API 값의 모양이 거의 다 다르다.** 화면은 사람이 고르기 좋은 말로,
// API는 서버가 다루기 좋은 enum과 숫자로 받는다. 옮기는 자리를 화면 안에 두면
// 테스트할 수 없어 여기로 뺐다.

import { SPECIES_PARAM, type PetProfileDraft } from "@/entities/pet";

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
 * 몸무게에서 숫자만 뽑는다.
 *
 * **자유 입력이라 "4키로"·"5 kg"처럼 단위가 섞여 들어온다.** API는 `double`이라
 * 그대로 보낼 수 없다. 숫자를 못 찾으면 `null`이고, 부르는 쪽이 보내지 않는다.
 *
 * **앞자리 0이 없는 소수도 받는다.** `.5`를 `5`로 읽으면 0.5kg 고양이가 5kg으로 저장된다.
 */
export function parseWeight(text: string): number | null {
  const matched = /(?:\d+(?:\.\d+)?|\.\d+)/.exec(text);
  if (!matched) {
    return null;
  }
  const weight = Number(matched[0]);
  // API가 @Positive다. 0은 거절당한다
  return weight > 0 ? weight : null;
}

/**
 * 생년월일을 `YYYY-MM-DD`로 맞춘다.
 *
 * 화면이 `0000. 00. 00` 꼴을 자리 표시로 주지만 자유 입력이라 `2022-03-15`,
 * `2022.3.15`, `20220315`이 다 들어온다. 생일은 선택이라 못 알아들으면 안 보내면 그만이다.
 *
 * **자리 수만 세면 안 된다.** `2003-10-92` 같은 값이 그대로 나가면 서버가 `LocalDate`로
 * 읽지 못해 본문을 통째로 거절한다(`Failed to read request`). 다른 칸까지 함께 죽는다.
 * 앞날도 막는다 — API가 `@PastOrPresent`라 거절당한다.
 */
export function parseBirthDate(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6));

  // 달력에 없는 날인지 본다. Date는 2월 30일을 3월 2일로 넘겨 버리므로 되읽어 견준다
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real || date.getTime() > Date.now()) {
    return null;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** 나이에서 숫자만 뽑는다. "4세"·"4살"처럼 단위가 붙어 들어온다 */
export function parseAge(text: string): number | null {
  const matched = /\d+/.exec(text);
  if (!matched) {
    return null;
  }
  const age = Number(matched[0]);
  return age > 0 ? age : null;
}

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
