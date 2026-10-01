// 찜 API. 카테고리별 목록 조회·상품 하나의 찜 여부·찜 토글 세 가지를 부른다.
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
  /** 할인 전 가격. `Product.originalPrice` 열이 NULL을 허용해 비어 올 수 있다 */
  originalPrice: number | null;
  reviewScore: number | null;
  reviewCount: number;
};

/**
 * 화면이 실제로 쓰는 필드만 이름을 옮겼다.
 *
 * **`reviewScore`·`reviewCount`는 옮기지 않는다.** 백엔드가 리뷰 벌크조회를 붙여(sever 0f1cae3)
 * 지금은 실제 평점이 오는데, 찜 카드 시안에 별점 자리가 없다(`views/likes/README.md`의 탭별 표).
 * 자리가 생기면 그때 옮긴다 — 전에는 "서버가 항상 null/0으로 고정해 둬서"라고 적혀 있었고
 * 그 근거는 더 이상 사실이 아니다 (#630).
 */
export type WishlistItem = {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  /**
   * 할인 전 가격. **비어 올 수 있다** — `Product.originalPrice`가 nullable이고
   * `WishlistService`가 그 값을 그대로 통과시킨다. 같은 열을 보는 `entities/product`의
   * `ProductCard.originalPrice`도 `number | null`이다.
   *
   * 전에는 `number`로 두고 "할인하지 않는 상품도 저장돼 있어 늘 온다"고 적었는데 근거가 없었다.
   * 화면은 `Price`가 falsy를 걸러 지금도 멀쩡하지만, 타입이 거짓이면 다음 사람이 그 위에서
   * 바로 셈을 한다 (#630).
   */
  originalPrice: number | null;
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
 * 상품 하나를 찜했는지 본다.
 *
 * 상품 하나를 보는 화면(상세·사진 모아보기·리뷰 상세)이 쓴다. 여러 상품을 늘어놓는 화면은
 * 상품마다 부를 수 없어 찜 목록으로 가른다 (#483).
 */
export function getWishlistStatus(productId: number): Promise<boolean> {
  return apiRequest<{ wished: boolean }>(`/members/me/wishlist/status/${productId}`).then(
    (response) => response.wished,
  );
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
