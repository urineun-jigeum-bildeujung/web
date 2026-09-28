// 찜을 켜고 끄는 훅. 좋아요 탭의 해제와 상품 화면들의 하트 토글이 같은 캐시를 건드려 한 자리에 둔다.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { toggleWishlist, type WishlistItem } from "./wishlist";

/** 제거하면서 기록해 둔, 실패했을 때 되돌릴 자리 하나 */
type RemovedEntry = { queryKey: QueryKey; item: WishlistItem; index: number };

type ToggleVariables = {
  productId: number;
  /** 누른 뒤의 상태. 화면에 보이던 하트를 뒤집은 값이다 */
  wished: boolean;
  /**
   * 찜 목록에 먼저 넣을 줄. 카드처럼 이름·가격을 아는 자리만 준다 — 없으면 목록은 재동기화에
   * 맡긴다. 가격 없는 줄을 넣으면 좋아요 탭이 그 사이 0원을 그린다
   */
  item?: WishlistItem;
};

/** 토글을 되돌릴 때 쓰는 것. 찜 여부는 누르기 전 값, 목록은 이 요청이 바꾼 줄만 */
type ToggleContext = {
  previousStatus: boolean | undefined;
  removed: RemovedEntry[];
  added: boolean;
};

/**
 * 찜 해제와 토글.
 *
 * **캐시가 두 갈래다.** 찜 목록(전체·카테고리별)은 좋아요 탭과 카드를 늘어놓는 화면이, 상품 하나의
 * 찜 여부는 상세처럼 상품 하나를 보는 화면이 읽는다. `staleTime`이 60초라 **한쪽만 바꾸면 1분 안에
 * 돌아온 화면이 틀린 하트를 보이고, PATCH가 토글이라 다음 누름이 반대로 뒤집힌다** (#483). 그래서
 * 해제든 토글이든 두 캐시를 함께 먼저 바꾸고, 진행 중인 요청이 모두 끝났을 때 둘 다 무효화한다.
 *
 * **되돌릴 때 전체 배열을 스냅샷으로 덮어쓰지 않는다.** 서로 다른 상품을 연달아
 * 눌렀을 때(A 실패, B는 그사이 성공) 전체 스냅샷으로 되돌리면 이미 성공한 B까지
 * 되살아난다 — 그래서 이 상품 하나가 원래 있던 캐시·위치만 기록해 뒀다가, 실패하면
 * **현재** 캐시에 그 상품 하나만 되끼운다(이미 있으면 중복 삽입하지 않는다). 다른
 * mutation의 결과는 건드리지 않는다. mutation을 상품별로 직렬화하지 않는다 —
 * 서로 다른 상품의 요청이 순서를 기다릴 이유가 없고, 같은 상품을 두 번 누른 토글은 순서가
 * 바뀌어도 결과가 같다.
 *
 * PATCH는 삭제가 아니라 토글이라 응답을 그대로 믿지 않는다("성공이든 실패든 서버가
 * 가진 것으로 맞춘다" — `use-mutate-cart-item.ts`와 같은 원칙). 진행 중인 요청이 모두
 * 끝났을 때 무효화해 서버 상태로 재동기화하고, mutation 자동 재시도는 쓰지 않는다.
 */
export function useMutateWishlist() {
  const queryClient = useQueryClient();
  const rootKey = QUERY_KEYS.user.likesAll();
  const statusRootKey = QUERY_KEYS.user.wishlistStatusAll();

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

  /**
   * 전체 목록 끝에 붙인다. **카테고리별 목록에는 넣지 않는다** — 응답에 상품의 카테고리가 없어
   * 어느 목록에 들어갈지 모른다. 그쪽은 재동기화가 채운다
   */
  async function addToAllList(item: WishlistItem): Promise<boolean> {
    const queryKey = QUERY_KEYS.user.likes(undefined);
    await queryClient.cancelQueries({ queryKey, exact: true });
    const items = queryClient.getQueryData<WishlistItem[]>(queryKey);
    if (!items || items.some((existing) => existing.productId === item.productId)) {
      return false;
    }
    queryClient.setQueryData<WishlistItem[]>(queryKey, [...items, item]);
    return true;
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

  function unadd(productId: number) {
    const queryKey = QUERY_KEYS.user.likes(undefined);
    const current = queryClient.getQueryData<WishlistItem[]>(queryKey);
    if (current) {
      queryClient.setQueryData<WishlistItem[]>(
        queryKey,
        current.filter((item) => item.productId !== productId),
      );
    }
  }

  /** 찜 여부를 먼저 바꾸고 누르기 전 값을 돌려준다 */
  async function setStatus(productId: number, wished: boolean): Promise<boolean | undefined> {
    const queryKey = QUERY_KEYS.user.wishlistStatus(productId);
    // 진행 중인 조회를 세운다. 그대로 두면 나중에 끝나면서 방금 바꾼 하트를 덮어쓴다
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<boolean>(queryKey);
    queryClient.setQueryData<boolean>(queryKey, wished);
    return previous;
  }

  // 아직 끝나지 않은 요청이 있으면 재조회하지 않는다. 그 요청이 반영되기 전의 목록을
  // 받아 덮어쓰면 방금 바꾼 상품이 되돌아간다. 자기 자신은 이 시점에 아직 pending이라 1이다
  const settle = () => {
    if (queryClient.isMutating({ mutationKey: rootKey }) === 1) {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: rootKey }),
        queryClient.invalidateQueries({ queryKey: statusRootKey }),
      ]);
    }
  };

  const removal = useMutation({
    mutationKey: rootKey,
    mutationFn: (productId: number) => toggleWishlist(productId),
    retry: false,
    onMutate: async (productId) => {
      const [removed, previousStatus] = await Promise.all([
        removeFromAllCaches(productId),
        setStatus(productId, false),
      ]);
      return { removed, previousStatus };
    },
    onError: (_error, productId, context) => {
      restore(context?.removed);
      queryClient.setQueryData<boolean>(
        QUERY_KEYS.user.wishlistStatus(productId),
        context?.previousStatus ?? true,
      );
    },
    onSettled: settle,
  });

  const toggle = useMutation({
    mutationKey: rootKey,
    mutationFn: ({ productId }: ToggleVariables) => toggleWishlist(productId),
    retry: false,
    onMutate: async ({ productId, wished, item }): Promise<ToggleContext> => {
      const previousStatus = await setStatus(productId, wished);
      if (!wished) {
        return { previousStatus, removed: await removeFromAllCaches(productId), added: false };
      }
      return { previousStatus, removed: [], added: item ? await addToAllList(item) : false };
    },
    onError: (_error, { productId, wished }, context) => {
      restore(context?.removed);
      if (context?.added) unadd(productId);
      // 누르기 전 값을 몰랐으면 화면이 보이던 값(뒤집기 전)으로 둔다. 재동기화가 곧 맞춘다
      queryClient.setQueryData<boolean>(
        QUERY_KEYS.user.wishlistStatus(productId),
        context?.previousStatus ?? !wished,
      );
    },
    onSettled: settle,
  });

  return {
    remove: removal.mutate,
    toggle: toggle.mutate,
  };
}
