// 주소 검색 결과를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { searchAddresses } from "./address-search";

/**
 * 찾은 말과 쪽으로 주소를 가져온다.
 *
 * 찾은 말이 비어 있으면 보낼 것이 없으므로 요청하지 않는다. 그때 `isPending`은 참으로 남으니
 * 화면이 "찾는 중"으로 읽지 않도록 `isSearching`을 따로 준다.
 *
 * **쪽을 넘길 때 앞 결과를 그대로 둔다.** 그러지 않으면 넘길 때마다 목록이 사라지고 뼈대가 번쩍여
 * 화면이 들썩인다. 뼈대는 보여 줄 앞 결과가 아예 없는 첫 검색에서만 나온다.
 */
export function useQueryAddressSearch(keyword: string, page: number) {
  const query = useQuery({
    queryKey: QUERY_KEYS.address.search(keyword, page),
    queryFn: () => searchAddresses(keyword, page),
    enabled: keyword.length > 0,
    placeholderData: keepPreviousData,
  });

  return {
    result: query.data,
    error: query.error,
    isSearching: keyword.length > 0 && query.isPending,
    /** 앞 결과를 보여 주면서 새 결과를 기다리는 중인지. 목록을 지우지 않고 기다린다는 표시에 쓴다 */
    isRefreshing: query.isPlaceholderData,
  };
}
