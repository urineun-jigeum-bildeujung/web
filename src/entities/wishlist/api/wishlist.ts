// 찜 API. 카테고리별 목록 조회와 찜 토글 두 가지를 부른다.
//
// 규격 출처는 실행 중인 백엔드(member-service) 컨트롤러 소스로 직접 확인했다(#390).

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `WishlistItemResponse` 그대로 */
type WishlistItemApiResponse = {
  productId: number;
  thumbnailUrl: string | null;
  wished: boolean;
  productName: string;
  price: number;
  originalPrice: number;
  reviewScore: number | null;
  reviewCount: number;
};

/** 화면이 실제로 쓰는 필드만 이름을 옮겼다. reviewScore·reviewCount는 백엔드가
 *  리뷰 벌크조회 연동 전까지 항상 null/0으로 고정해 둬(#390) 옮기지 않는다 */
export type WishlistItem = {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  /** 할인 전 가격. 할인하지 않는 상품도 저장돼 있어 늘 오고, 그때는 `price`와 같다 */
  originalPrice: number;
};

function toWishlistItem(response: WishlistItemApiResponse): WishlistItem {
  return {
    productId: response.productId,
    name: response.productName,
    thumbnailUrl: response.thumbnailUrl,
    price: response.price,
    originalPrice: response.originalPrice,
  };
}

/**
 * 찜 목록을 가져온다.
 *
 * `categoryCode`는 백엔드 `CategoryCode` 값이다(`entities/product`의 `CATEGORY_TO_API`로
 * 변환한 값을 넘긴다) — 이 함수는 화면의 URL 값(`food` 등)을 모른다. 생략하면 전체를 받는다.
 * 페이지네이션이 없어 한 번에 전부 온다.
 */
export function getWishlist(categoryCode?: string): Promise<WishlistItem[]> {
  return apiRequest<WishlistItemApiResponse[]>("/members/me/wishlist", {
    query: { category: categoryCode },
  }).then((items) => items.map(toWishlistItem));
}

/**
 * 찜 상태를 토글한다.
 *
 * **삭제가 아니라 토글이다.** 응답 `wished`를 무조건 "해제됨"으로 믿지 않는다 —
 * 중복 요청이나 오래된 상태에서 `true`가 돌아올 수 있다. 호출부는 이 값을 쓰지 않고
 * 최종적으로 목록을 다시 조회해 서버 상태와 맞춘다.
 */
export function toggleWishlist(productId: number): Promise<{ wished: boolean }> {
  return apiRequest<{ wished: boolean }>(`/members/me/wishlist/${productId}`, {
    method: "PATCH",
  });
}
