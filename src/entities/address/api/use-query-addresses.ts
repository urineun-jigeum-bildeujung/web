// 저장해 둔 배송지 목록을 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getAddresses } from "./addresses";

/**
 * 저장해 둔 배송 받을 곳을 가져온다. 기본 배송지가 앞에 온다.
 *
 * 하나도 없으면 빈 배열이다 — 실패가 아니라 아직 등록하지 않은 상태이므로,
 * 부르는 화면이 등록하러 가는 자리를 보인다.
 */
export function useQueryAddresses() {
  const query = useQuery({
    queryKey: QUERY_KEYS.address.list(),
    queryFn: getAddresses,
  });

  return {
    addresses: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
