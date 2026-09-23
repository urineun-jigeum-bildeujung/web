// 찜을 토글하는 훅. 화면(좋아요 탭)은 확인 없이 바로 목록에서 빼는 동작이라 낙관적으로 갱신한다.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { toggleWishlist, type WishlistItem } from "./wishlist";

/** 제거하면서 기록해 둔, 실패했을 때 되돌릴 자리 하나 */
type RemovedEntry = { queryKey: QueryKey; item: WishlistItem; index: number };

/**
 * 찜 해제.
 *
 * **전체·카테고리별 캐시를 모두 바꾼다.** 찜 목록은 `entities/cart`의 장바구니 훅과
 * 같은 흐름을 쓰되, 캐시가 여러 개(전체 조회 + 카테고리별 조회)라는 점이 다르다 —
 * `QUERY_KEYS.user.likesAll()`로 시작하는 모든 캐시에서 한 번에 빼고 돌려놓는다.
 *
 * **되돌릴 때 전체 배열을 스냅샷으로 덮어쓰지 않는다.** 서로 다른 상품을 연달아
 * 눌렀을 때(A 실패, B는 그사이 성공) 전체 스냅샷으로 되돌리면 이미 성공한 B까지
 * 되살아난다 — 그래서 이 상품 하나가 원래 있던 캐시·위치만 기록해 뒀다가, 실패하면
 * **현재** 캐시에 그 상품 하나만 되끼운다(이미 있으면 중복 삽입하지 않는다). 다른
 * mutation의 결과는 건드리지 않는다. mutation을 상품별로 직렬화하지 않는다 —
 * 서로 다른 상품의 요청이 순서를 기다릴 이유가 없다.
 *
 * PATCH는 삭제가 아니라 토글이라 응답을 그대로 믿지 않는다("성공이든 실패든 서버가
 * 가진 것으로 맞춘다" — `use-mutate-cart-item.ts`와 같은 원칙). 끝나면 무조건 무효화해
 * 서버 상태로 재동기화하고, mutation 자동 재시도는 쓰지 않는다.
 */
export function useMutateWishlist() {
  const queryClient = useQueryClient();
  const rootKey = QUERY_KEYS.user.likesAll();

  async function removeFromAllCaches(productId: number): Promise<RemovedEntry[]> {
    await queryClient.cancelQueries({ queryKey: rootKey });
    const removed: RemovedEntry[] = [];
    for (const [queryKey, items] of queryClient.getQueriesData<WishlistItem[]>({
      queryKey: rootKey,
    })) {
      if (!items) continue;
      const index = items.findIndex((item) => item.productId === productId);
      if (index === -1) continue;
      removed.push({ queryKey, item: items[index], index });
      queryClient.setQueryData<WishlistItem[]>(
        queryKey,
        items.filter((item) => item.productId !== productId),
      );
    }
    return removed;
  }

  function restore(entries: RemovedEntry[] | undefined) {
    for (const { queryKey, item, index } of entries ?? []) {
      const current = queryClient.getQueryData<WishlistItem[]>(queryKey);
      if (!current || current.some((existing) => existing.productId === item.productId)) {
        continue;
      }
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, item);
      queryClient.setQueryData<WishlistItem[]>(queryKey, next);
    }
  }

  const mutation = useMutation({
    mutationFn: (productId: number) => toggleWishlist(productId),
    retry: false,
    onMutate: (productId) => removeFromAllCaches(productId),
    onError: (_error, _productId, entries) => restore(entries),
    onSettled: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });

  return {
    remove: mutation.mutate,
  };
}
