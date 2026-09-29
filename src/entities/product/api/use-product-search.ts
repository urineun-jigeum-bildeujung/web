// 검색 결과의 커서 이어 받기 상태를 관리하는 훅.
//
// 첫 쪽은 서버 컴포넌트가 `use()`로 이미 풀어 준 값을 그대로 받는다 — 이 훅이 다시 부르지
// 않는다. 목록 끝에 닿으면 다음 쪽만 브라우저에서 `searchMoreProducts`로 불러 붙인다(#532).
// 카테고리 목록의 `useProductList`와 모양은 같지만 부르는 API가 다르고 "총 N개"를 함께
// 들고 있어 따로 둔다. TanStack Query로 감싸지 않는 이유도 그 훅과 같다(README).

"use client";

import { useState } from "react";

import { searchMoreProducts, type ProductSearchResult, type ProductSort } from "./products";

/**
 * `params`는 첫 쪽을 부른 검색어·정렬 그대로여야 한다. 커서에 둘이 새겨져 있어, 화면의 정렬이
 * 먼저 바뀐 값을 넘기면 서버가 커서를 거절한다. 검색어나 정렬이 바뀌면 부르는 쪽이 이 훅을
 * 쓰는 컴포넌트를 `key`로 다시 마운트해 목록·커서를 처음부터 세운다.
 */
export function useProductSearch(
  first: ProductSearchResult,
  params: { keyword: string; sort: ProductSort },
) {
  const [items, setItems] = useState(first.items);
  const [nextCursor, setNextCursor] = useState(first.nextCursor);
  const [hasNext, setHasNext] = useState(first.hasNext);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    if (loading || !nextCursor) return;
    // 실패 표시는 다시 받는 동안에도 남긴다. 화면의 다시 시도 버튼이 그 자리에서 대기를
    // 보이며 잠겨 있어야, 또 눌러 같은 커서로 요청이 한 번 더 나가지 않는다(주문·후기 목록과 같다, #427)
    setLoading(true);
    try {
      const next = await searchMoreProducts({ ...params, cursor: nextCursor });
      // 넘기는 사이 줄 세우는 값(판매량·후기 수·가격)이 바뀐 상품은 다음 쪽에 또 올 수 있다.
      // 같은 상품이 두 번 그려지면 React key가 겹친다
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.productId));
        return [...prev, ...next.items.filter((item) => !seen.has(item.productId))];
      });
      setNextCursor(next.nextCursor);
      setHasNext(next.hasNext);
      setFailed(false);
    } catch {
      // 이미 받은 목록은 그대로 두고 다시 시도할 수 있게 한다
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // 개수는 첫 쪽이 센 값을 그대로 쓴다. 다음 쪽 응답엔 개수가 null로 온다(서버가 세지 않는다)
  return { items, totalCount: first.totalCount, hasNext, loading, failed, loadMore };
}
