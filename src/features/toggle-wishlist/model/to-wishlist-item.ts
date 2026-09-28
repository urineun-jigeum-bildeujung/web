// 화면이 가진 상품 값을 찜 목록 한 줄로 옮긴다. 찜을 켤 때 좋아요 탭의 목록에 먼저 넣는 줄이다 (#483).

import type { WishlistItem } from "@/entities/wishlist";

type WishableProduct = {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  originalPrice: number | null;
};

/**
 * **정가가 없으면 판매가로 채운다.** 찜 응답은 할인하지 않는 상품도 정가를 판매가와 같은 값으로
 * 준다(#390) — 좋아요 탭은 두 값이 같으면 취소선·할인율을 그리지 않는다.
 */
export function toWishlistItem({
  productId,
  name,
  thumbnailUrl,
  price,
  originalPrice,
}: WishableProduct): WishlistItem {
  // 카드 모델을 통째로 펼치지 않는다 — 별점·단가 같은 필드가 찜 목록 캐시에 섞인다
  return { productId, name, thumbnailUrl, price, originalPrice: originalPrice ?? price };
}
