// 찜을 세운다. 찜 여부·찜 목록·토글을 한 상태로 묶어, 토글하면 여부와 목록이 함께 바뀐다 —
// 실제 서버처럼 새로고침해도 남는지 볼 수 있다 (#483).
//
// **로그인이 있어야 하는 요청이다.** 세우지 않으면 401이고, 백엔드가 떠 있느냐에 따라 같은 테스트가
// 로컬과 CI에서 달라진다. 무엇을 보내는지는 단위 테스트(`entities/wishlist/api/wishlist.test.ts`)가 본다.

import type { Page, Route } from "@playwright/test";

type WishlistStubOptions = {
  /** 처음부터 찜해 둔 상품 번호 */
  wished?: number[];
};

const productIdOf = (route: Route) =>
  Number(new URL(route.request().url()).pathname.split("/").pop());

export async function stubWishlist(page: Page, { wished = [] }: WishlistStubOptions = {}) {
  const ids = new Set(wished);
  /** 토글로 나간 상품 번호. 무엇을 뒤집었는지 보는 테스트가 쓴다 */
  const toggled: number[] = [];

  // `*`는 `/`를 넘지 않아 세 경로가 섞이지 않는다
  await page.route("**/members/me/wishlist/status/*", (route) =>
    route.fulfill({ json: { wished: ids.has(productIdOf(route)) } }),
  );
  await page.route("**/members/me/wishlist/*", (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    const productId = productIdOf(route);
    if (ids.has(productId)) ids.delete(productId);
    else ids.add(productId);
    toggled.push(productId);
    return route.fulfill({ json: { wished: ids.has(productId) } });
  });
  await page.route("**/members/me/wishlist", (route) =>
    route.fulfill({
      json: [...ids].map((productId) => ({
        productId,
        thumbnailUrl: null,
        wished: true,
        productName: `상품 ${productId}`,
        price: 10000,
        originalPrice: 10000,
        reviewScore: null,
        reviewCount: 0,
      })),
    }),
  );

  return { toggled };
}
