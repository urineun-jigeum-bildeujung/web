// 주소 검색 결과를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { searchAddresses } from "./address-search";

/**
 * 찾은 말과 쪽으로 주소를 가져온다.
 *
 * 찾은 말이 비어 있으면 보낼 것이 없으므로 요청하지 않는다. 그때 `isPending`은 참으로 남으니
 * 화면이 "찾는 중"으로 읽지 않도록 `isSearching`을 따로 준다.
 */
export function useQueryAddressSearch(keyword: string, page: number) {
  const query = useQuery({
    queryKey: QUERY_KEYS.address.search(keyword, page),
    queryFn: () => searchAddresses(keyword, page),
    enabled: keyword.length > 0,
  });

  return {
    result: query.data,
    error: query.error,
    isSearching: keyword.length > 0 && query.isPending,
  };
}
