// 하트를 눌렀을 때 할 일을 정한다. 로그인했으면 찜을 뒤집고, 아니면 로그인 필요 토스트를 띄운다 (#483, #542).
//
// 하트는 상품 상세·사진 모아보기·리뷰 상세·검색 결과·함께 보면 좋은 상품에 있다. 로그인 확인을
// 화면마다 두면 한 곳이 빠지는 순간 로그아웃 상태에서 PATCH가 나가 401과 재발급 시도만 헛돈다.

import { useMutateWishlist, type WishlistItem } from "@/entities/wishlist";
import { useRequireSession } from "@/shared/api/use-require-session";
import { useSessionState } from "@/shared/api/use-session-state";

export function useToggleWishlist() {
  const session = useSessionState();
  const requireSession = useRequireSession();
  const wishlist = useMutateWishlist();

  return {
    /** 찜 조회를 켤지. 로그아웃 상태에서 부르면 401과 재발급 시도가 헛돈다 */
    signedIn: session === true,
    /**
     * 하트를 눌렀을 때 부른다. `wished`는 누른 뒤의 상태, `item`은 찜 목록에 먼저 넣을 줄이다.
     *
     * 찜을 바꿨으면 true를 돌려준다. 로그인하지 않아 토스트만 띄웠거나 로그인 여부를 아직 몰라
     * 아무것도 하지 않았으면 false다 — 담김 안내는 true일 때만 띄운다.
     */
    toggle(productId: number, wished: boolean, item?: WishlistItem): boolean {
      if (!requireSession()) {
        return false;
      }
      wishlist.toggle({ productId, wished, item });
      return true;
    },
  };
}
