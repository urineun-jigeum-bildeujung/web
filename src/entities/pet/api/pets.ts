// 내 아이 목록과 한 아이의 상세를 백엔드에서 받는다.
//
// **목록은 순서를 보장하지 않는다.** 백엔드 `findByMemberId`에 `ORDER BY`가 없어 순서가
// DB에 달렸다. 아이 전환 줄은 순서가 흔들리면 눌렀던 자리가 매번 달라지므로 기본 아이를
// 앞으로 올려 여기서 정렬한다(#230).

import { apiRequest } from "@/shared/api/client";

import type { PetSpecies } from "../model/breeds";

/** 백엔드 `PetSummaryResponse`와 같은 모양이다 */
type PetSummaryResponse = {
  petId: number;
  name: string;
  image: string | null;
  isDefault: boolean;
};

/** 백엔드 `PetDetailResponse`와 같은 모양이다 */
type PetDetailResponse = {
  petId: number;
  name: string;
  species: "DOG" | "CAT";
  breedId: number;
  breedName: string;
  age: number;
  birthDate: string | null;
  sex: "MALE" | "FEMALE";
  isNeutered: boolean;
  /** 고양이는 체구가 없어 `null`이다(#391) */
  size: "SMALL" | "MEDIUM" | "LARGE" | null;
  weight: number;
  bcs: number;
  healthConcerns: string[];
  /** 등록 선택지(`GET /pets/health-options`)와 같은 모양이다 */
  allergies: { code: string; displayName: string }[];
  image: string | null;
  isDefault: boolean;
};

/** 알레르기 한 항목. 저장값과 보일 이름을 함께 든다 */
export type AllergyOption = {
  /** `CHICKEN` 같은 코드 */
  code: string;
  displayName: string;
};

/** 아이 전환 줄이 쓰는 최소 정보 */
export type PetListItem = {
  id: string;
  name: string;
  photoUrl?: string;
  /** 기본 아이. 화면이 처음 고를 아이를 이것으로 정한다 */
  isDefault: boolean;
};

export type PetDetail = {
  id: string;
  name: string;
  species: PetSpecies;
  breedId: number;
  breedName: string;
  age: number;
  /** `YYYY-MM-DD`. 등록 때 안 적었으면 없다 */
  birthDate: string | null;
  gender: "male" | "female";
  neutered: boolean;
  /** 고양이는 체구를 묻지 않아 `null`이다 */
  size: "small" | "medium" | "large" | null;
  weight: number;
  /** 체형 1~5. 화면 슬라이더는 0부터 세므로 옮길 때 하나를 뺀다 */
  bcs: number;
  healthConcerns: string[];
  /**
   * 알레르기. 저장은 `code`로 하고 화면에는 `displayName`을 보인다.
   *
   * **상세 조회가 코드만 주던 때가 있었다.** 그때는 선택지를 따로 받아 짝을 맞추거나
   * 코드를 그대로 보여야 했는데, 백엔드가 표시명을 함께 싣기로 하면서 사라진 문제다.
   */
  allergies: AllergyOption[];
  photoUrl?: string;
  isDefault: boolean;
};

const SPECIES_OF: Record<"DOG" | "CAT", PetSpecies> = { DOG: "dog", CAT: "cat" };
const GENDER_OF = { MALE: "male", FEMALE: "female" } as const;
const SIZE_OF = { SMALL: "small", MEDIUM: "medium", LARGE: "large" } as const;

/** 기본 아이를 앞으로. 나머지는 서버가 준 순서를 지킨다 */
function defaultFirst(pets: PetListItem[]): PetListItem[] {
  return [...pets].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export async function getPets(): Promise<PetListItem[]> {
  const response = await apiRequest<PetSummaryResponse[]>("/members/me/pets");

  return defaultFirst(
    response.map((pet) => ({
      id: String(pet.petId),
      name: pet.name,
      ...(pet.image && { photoUrl: pet.image }),
      isDefault: pet.isDefault,
    })),
  );
}

export async function getPetDetail(petId: string): Promise<PetDetail> {
  const pet = await apiRequest<PetDetailResponse>(`/members/me/pets/${petId}`);

  return {
    id: String(pet.petId),
    name: pet.name,
    species: SPECIES_OF[pet.species],
    breedId: pet.breedId,
    breedName: pet.breedName,
    age: pet.age,
    birthDate: pet.birthDate,
    gender: GENDER_OF[pet.sex],
    neutered: pet.isNeutered,
    size: pet.size === null ? null : SIZE_OF[pet.size],
    weight: pet.weight,
    bcs: pet.bcs,
    healthConcerns: pet.healthConcerns,
    allergies: pet.allergies,
    ...(pet.image && { photoUrl: pet.image }),
    isDefault: pet.isDefault,
  };
}

/**
 * 고칠 것만 보낸다.
 *
 * **전 필드가 선택이다.** 화면마다 고치는 항목이 달라, 기본 정보 화면이 몸무게를
 * 덮어쓰지 않으려면 보내지 않아야 한다.
 *
 * `allergies`는 코드만 보낸다 — 표시명은 서버가 아는 값이라 되돌려 줄 필요가 없다.
 */
export type PetUpdate = Partial<{
  name: string;
  sex: "MALE" | "FEMALE";
  isNeutered: boolean;
  species: "DOG" | "CAT";
  age: number;
  birthDate: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
  weight: number;
  bcs: number;
  image: string;
  breedId: number;
  healthConcerns: string[];
  allergies: string[];
}>;

export function updatePet(petId: string, patch: PetUpdate): Promise<void> {
  return apiRequest<void>(`/members/me/pets/${petId}`, { method: "PATCH", body: patch });
}
