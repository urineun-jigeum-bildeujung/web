// 주소를 찾아온다. 행정안전부 도로명주소 API를 우리 Route Handler(`/api/juso`)를 거쳐 부른다.
//
// 직접 부르지 않는 이유는 승인키 하나다. 행안부는 CORS를 열어 두었지만 브라우저에서 부르면
// `confmKey`가 클라이언트 번들에 박힌다. 서버에서만 읽는다.
//
// 페이지를 화면이 아니라 여기서 다루는 이유는 행안부가 `currentPage`·`countPerPage`로
// 서버에서 잘라 주기 때문이다. 화면은 몇 쪽인지만 넘기고 자를 일이 없다.

import { ApiError, type ProblemDetail } from "@/shared/api/client";
import type { AddressResult } from "@/shared/ui/address-result-list/address-result-list";

/** 한 페이지에 보여줄 개수. PD팀이 393×852에서 스크롤 없이 들어가는 수로 4개를 정했다 (2026-09-15) */
export const ADDRESS_PAGE_SIZE = 4;

export type AddressSearchResult = {
  /** 이번 페이지에 보여줄 주소 */
  items: AddressResult[];
  /** 검색어에 걸린 전체 개수. 행안부 응답의 `common.totalCount`에 해당한다 */
  totalCount: number;
  /** 실제로 보여 준 쪽. 요청한 쪽이 범위를 벗어나면 보정된 값이 온다 */
  page: number;
};

/** Route Handler가 돌려주는 모양 */
type JusoRouteResponse = {
  items: AddressResult[];
  totalCount: number;
  currentPage: number;
};

async function requestPage(keyword: string, page: number): Promise<JusoRouteResponse> {
  const query = new URLSearchParams({
    keyword,
    currentPage: String(page),
    countPerPage: String(ADDRESS_PAGE_SIZE),
  });

  const response = await fetch(`/api/juso?${query}`);

  if (!response.ok) {
    // Route Handler가 실패를 ProblemDetail로 옮겨 준다. `toAppMessageCode`가 알아듣는 형태다
    const problem = (await response.json().catch(() => undefined)) as ProblemDetail | undefined;
    throw new ApiError(response.status, problem?.detail ?? "주소 검색 실패", problem);
  }

  return (await response.json()) as JusoRouteResponse;
}

/**
 * 주소를 찾는다. `page`는 1부터 센다.
 *
 * 행안부는 0·음수·숫자가 아닌 쪽을 1로 보정해 주지만 **마지막 쪽을 넘는 값은 보정하지 않는다** —
 * `page=999`에 `totalCount=1`이면서 결과 0건을 준다(2026-09-15 실측). 그 경우에만 마지막 쪽을 다시 받는다.
 */
export async function searchAddresses(keyword: string, page: number): Promise<AddressSearchResult> {
  const first = await requestPage(keyword, page);
  const lastPage = Math.max(1, Math.ceil(first.totalCount / ADDRESS_PAGE_SIZE));

  if (first.items.length > 0 || first.totalCount === 0 || first.currentPage <= lastPage) {
    return { items: first.items, totalCount: first.totalCount, page: first.currentPage };
  }

  // 찾은 것이 있는데 이 쪽에는 없다. 주소창에 마지막 쪽을 넘는 값이 들어온 경우다
  const corrected = await requestPage(keyword, lastPage);
  return { items: corrected.items, totalCount: corrected.totalCount, page: lastPage };
}
