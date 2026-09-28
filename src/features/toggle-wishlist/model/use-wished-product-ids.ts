// 카드를 늘어놓는 화면이 어느 상품을 찜했는지 알아낸다. 전체 찜 목록 하나로 가른다 (#483).
//
// 카드마다 찜 여부를 물을 수 없다. 좋아요 탭과 같은 전체 찜 목록 캐시를 읽어, 토글이 그 캐시를
// 먼저 바꾸면 여기 하트도 함께 바뀐다.

import { useQueryWishlist } from "@/entities/wishlist";
import { useSessionState } from "@/shared/api/use-session-state";

/**
 * 찜한 상품 번호. 로그인했을 때만 찜 목록을 부르고, 로그아웃이면 비어 있다 — 세션이 만료돼 캐시가
 * 남아도 전의 하트를 채우지 않는다.
 */
export function useWishedProductIds(): Set<number> {
  const signedIn = useSessionState() === true;
  const { items } = useQueryWishlist(undefined, { enabled: signedIn });
  return new Set(signedIn ? items?.map((item) => item.productId) : []);
}
