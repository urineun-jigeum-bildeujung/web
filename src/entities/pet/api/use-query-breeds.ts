// 품종 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQueries } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { PET_SPECIES, type PetSpecies } from "../model/breeds";
import { getBreeds, type SpeciesBreed } from "./breeds";

/**
 * 강아지·고양이 품종을 함께 가져온다.
 *
 * **두 번 부르는 이유는 API가 종을 필수로 받기 때문이다.** 품종 화면은 두 종을 한 번에
 * 보이고 검색도 양쪽을 훑으므로(`breed-picker`), 한쪽만 받으면 고양이 보호자가 자기 아이의
 * 품종을 찾지 못한다.
 *
 * 종마다 캐시가 따로 잡혀 한쪽이 실패해도 다른 쪽은 살아 있다. 둘 중 하나라도 실패하면
 * 목록이 반쪽이 되므로 `error`로 알린다.
 */
export function useQueryBreeds() {
  const results = useQueries({
    queries: PET_SPECIES.map((species) => ({
      queryKey: QUERY_KEYS.catalog.breeds(species),
      queryFn: () => getBreeds(species),
    })),
  });

  // 종을 붙여 한 줄로 편다. 같은 이름("기타")이 양쪽에 있어도 id가 달라 섞이지 않는다
  const breeds: SpeciesBreed[] = results.flatMap((result, index) =>
    (result.data ?? []).map((breed) => ({ ...breed, species: PET_SPECIES[index] as PetSpecies })),
  );

  return {
    breeds,
    isLoading: results.some((result) => result.isPending),
    error: results.find((result) => result.error)?.error ?? null,
  };
}
