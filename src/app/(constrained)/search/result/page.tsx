// /search/result 라우트. 화면 조립은 views/search-result에 있다.
//
// 검색은 서버에서 조회한다(#282). 여기서 만든 Promise를 await하지 않고 그대로
// SearchResultView에 넘긴다 — 화면 안의 결과 영역이 `use()`로 풀면서 그 부분만
// Suspense로 대기하고, 헤더·검색바·제목은 기다리지 않는다.

import { Suspense } from "react";

import { searchProducts, type ProductSearchResult } from "@/entities/product";
import { SearchResultView, SORTS, SORT_TO_API, type ResultSort } from "@/views/search-result";

function toSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isResultSort(value: string | undefined): value is ResultSort {
  return (SORTS as readonly string[]).includes(value ?? "");
}

export default async function SearchResultPage({ searchParams }: PageProps<"/search/result">) {
  const params = await searchParams;
  const keyword = toSearchParam(params.q) ?? "";
  const sortParam = toSearchParam(params.sort);
  const sort = isResultSort(sortParam) ? sortParam : "recommend";

  // 검색어 없이 이 화면에 들어오는 경우(주소를 직접 친 경우 등)는 검색 API가 요구하는
  // keyword 최소 길이(1)를 못 채운다. 빈 검색어로 뭘 보여줄지는 정책이 없어, 요청을
  // 보내지 않고 바로 빈 결과로 처리한다 — "검색 결과 없음" 화면으로 자연스럽게 이어진다
  const resultsPromise: Promise<ProductSearchResult> = keyword
    ? searchProducts({ keyword, sort: SORT_TO_API[sort] })
    : Promise.resolve({ items: [], totalCount: 0, nextCursor: null, hasNext: false });

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SearchResultView resultsPromise={resultsPromise} />
    </Suspense>
  );
}
