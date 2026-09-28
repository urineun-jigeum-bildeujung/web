// 카드를 늘어놓는 화면이 어느 상품을 찜했는지 알아낸다. 전체 찜 목록 하나로 가른다 (#483).
//
// 카드마다 찜 여부를 물을 수 없다. 좋아요 탭과 같은 전체 찜 목록 캐시를 읽어, 토글이 그 캐시를
// 먼저 바꾸면 여기 하트도 함께 바뀐다.

import { useQueryWishlist } from "@/entities/wishlist";
import { useSessionState } from "@/shared/api/use-session-state";

/**
 * 찜한 상품 번호. 로그인했을 때만 찜 목록을 부르고, 로그아웃이면 비어 있다 — 세션이 만료돼 캐시가
 * 남아도 전의 하트를 채우지 않는다.
 *
 * **받는 동안(`isLoading`)은 하트를 누르게 두지 않는다.** PATCH가 토글이라, 모르는 채로 누르면
 * 이미 찜한 상품을 찜하려던 사람의 찜이 서버에서 지워진다(#493 리뷰).
 */
export function useWishedProductIds(): { wishedIds: Set<number>; isLoading: boolean } {
  const signedIn = useSessionState() === true;
  const { items, isLoading } = useQueryWishlist(undefined, { enabled: signedIn });
  return {
    wishedIds: new Set(signedIn ? items?.map((item) => item.productId) : []),
    // 꺼 둔 조회는 대기가 끝나지 않는다. 로그인했을 때만 받는 중으로 본다
    isLoading: signedIn && isLoading,
  };
}
