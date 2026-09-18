// 아이 한 마리의 상세를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getPetDetail } from "./pets";

/**
 * 고른 아이의 상세를 가져온다.
 *
 * **아이를 고르기 전에는 부르지 않는다.** 목록을 받아야 첫 아이가 정해지므로 그전까지
 * `petId`가 없다. 그 사이에 `/pets/undefined`로 나가지 않게 `enabled`로 막는다.
 */
export function useQueryPetDetail(petId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.pet.detail(petId ?? ""),
    queryFn: () => getPetDetail(petId as string),
    enabled: Boolean(petId),
  });

  // 꺼 둔 조회는 `isPending`이 계속 참이다. 실제로 받아오는 중인지 보려면 `isLoading`이어야
  // 아이를 고르기 전 화면이 불러오는 중으로 굳지 않는다
  return {
    pet: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
