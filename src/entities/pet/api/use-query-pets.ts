// 내 아이 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getPets } from "./pets";

/**
 * 로그인한 보호자의 아이 목록을 가져온다. 기본 아이가 앞에 온다.
 *
 * 아이가 하나도 없으면 빈 배열이다 — 실패가 아니라 아직 등록하지 않은 상태이므로
 * 부르는 화면이 온보딩으로 보내는 자리를 보인다.
 */
export function useQueryPets() {
  const query = useQuery({
    queryKey: QUERY_KEYS.pet.list(),
    queryFn: getPets,
  });

  return {
    pets: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
