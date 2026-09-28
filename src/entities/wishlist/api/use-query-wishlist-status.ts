// 상품 하나의 찜 여부를 가져오는 훅. 화면은 useQuery를 직접 부르지 않는다(code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getWishlistStatus } from "./wishlist";

/**
 * 상품 하나를 찜했는지 가져온다.
 *
 * **로그인해야 부른다.** 로그아웃 상태에서 부르면 방문할 때마다 401과 재발급 시도가 헛돈다 —
 * 부르는 쪽이 `enabled`로 막는다.
 */
export function useQueryWishlistStatus(productId: number, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: QUERY_KEYS.user.wishlistStatus(productId),
    queryFn: () => getWishlistStatus(productId),
    enabled: options?.enabled,
  });

  return { wished: query.data };
}
