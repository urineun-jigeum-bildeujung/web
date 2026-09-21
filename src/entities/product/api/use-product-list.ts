// 카테고리별 상품 목록의 커서 페이지네이션 상태를 관리하는 훅.
//
// 첫 페이지는 서버 컴포넌트가 `use()`로 이미 풀어 준 값을 그대로 받는다 — 이 훅이
// 다시 불러오지 않는다. "더 보기"로 이어지는 다음 페이지만 브라우저에서 `getProducts`를
// 불러 붙인다(#289). TanStack Query로 감싸지 않는 이유는 `entities/product/README.md`에
// 적힌 대로다 — 공개 데이터라 첫 페이지는 서버 컴포넌트가 직접 부르고, 캐싱·무효화가
// 필요 없는 단순 이어 붙이기라 Query 캐시를 쓸 이유가 없다.

"use client";

import { useState } from "react";

import { getProducts, type ProductCard, type ProductCategory, type ProductSort } from "./products";

export type UseProductListFirstPage = {
  items: ProductCard[];
  nextCursor: string | null;
  hasNext: boolean;
};

export function useProductList(
  first: UseProductListFirstPage,
  params: { category?: ProductCategory; sort: ProductSort },
) {
  const [items, setItems] = useState(first.items);
  const [nextCursor, setNextCursor] = useState(first.nextCursor);
  const [hasNext, setHasNext] = useState(first.hasNext);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    if (loading || !nextCursor) return;
    setLoading(true);
    setFailed(false);
    try {
      const next = await getProducts({ ...params, cursor: nextCursor });
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.productId));
        return [...prev, ...next.items.filter((item) => !seen.has(item.productId))];
      });
      setNextCursor(next.nextCursor);
      setHasNext(next.hasNext);
    } catch {
      // 기존 목록은 그대로 두고 다시 시도할 수 있게 버튼을 살려 둔다
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return { items, hasNext, loading, failed, loadMore };
}
