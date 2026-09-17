// 품종 목록을 백엔드에서 받는다. 종을 반드시 함께 보낸다.
//
// **품종을 id로 다루는 이유는 등록 API다.** `POST /members/me/pets`가 `breedId`를 필수로
// 받으므로 이름 문자열만 들고는 요청을 만들 수 없다.

import { apiRequest } from "@/shared/api/client";

import { SPECIES_PARAM, type PetSpecies } from "../model/breeds";

/** 백엔드 `BreedResponse`와 같은 모양이다 */
export type Breed = {
  id: number;
  breedName: string;
};

/** 어느 종의 품종인지까지 들고 다닌다. 고른 품종이 종도 정하기 때문이다 */
export type SpeciesBreed = Breed & { species: PetSpecies };

export function getBreeds(species: PetSpecies): Promise<Breed[]> {
  return apiRequest<Breed[]>("/pets/breeds", { query: { species: SPECIES_PARAM[species] } });
}
