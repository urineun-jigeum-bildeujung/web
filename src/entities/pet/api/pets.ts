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
  size: "SMALL" | "MEDIUM" | "LARGE";
  weight: number;
  bcs: number;
  healthConcerns: string[];
  /** `CHICKEN` 같은 코드다. 표시명은 `GET /pets/health-options`에서 되찾는다 */
  allergies: string[];
  image: string | null;
  isDefault: boolean;
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
  size: "small" | "medium" | "large";
  weight: number;
  /** 체형 1~5. 화면 슬라이더는 0부터 세므로 옮길 때 하나를 뺀다 */
  bcs: number;
  healthConcerns: string[];
  /** 코드 배열이다. 표시명이 필요하면 `toAllergyLabels`를 쓴다 */
  allergyCodes: string[];
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
    size: SIZE_OF[pet.size],
    weight: pet.weight,
    bcs: pet.bcs,
    healthConcerns: pet.healthConcerns,
    allergyCodes: pet.allergies,
    ...(pet.image && { photoUrl: pet.image }),
    isDefault: pet.isDefault,
  };
}
