// 건강 고민·알레르기 선택지를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { PetSpecies } from "../model/breeds";
import { getHealthOptions } from "./health-options";

/**
 * 고른 종의 선택지를 가져온다.
 *
 * **종이 바뀌면 다시 받는다.** 갈래도 항목도 종마다 다르므로 키에 종을 넣는다 —
 * 빠뜨리면 고양이 보호자가 강아지 질환 갈래를 보게 된다.
 */
export function useQueryHealthOptions(species: PetSpecies) {
  const query = useQuery({
    queryKey: QUERY_KEYS.catalog.healthConcerns(species),
    queryFn: () => getHealthOptions(species),
  });

  return {
    options: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
