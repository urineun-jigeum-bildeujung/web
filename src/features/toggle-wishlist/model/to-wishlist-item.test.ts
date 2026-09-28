// toWishlistItem 테스트. 정가가 없는 상품을 찜 응답과 같은 모양(정가 = 판매가)으로 옮기는지 본다.
import { expect, test } from "vitest";

import { toWishlistItem } from "./to-wishlist-item";

test("정가가 없으면 판매가로 채운다", () => {
  expect(
    toWishlistItem({
      productId: 3,
      name: "덴탈껌",
      thumbnailUrl: null,
      price: 8000,
      originalPrice: null,
    }),
  ).toEqual({ productId: 3, name: "덴탈껌", thumbnailUrl: null, price: 8000, originalPrice: 8000 });
});

test("정가가 있으면 그대로 둔다", () => {
  expect(
    toWishlistItem({
      productId: 3,
      name: "덴탈껌",
      thumbnailUrl: "https://example.com/a.jpg",
      price: 8000,
      originalPrice: 10000,
    }).originalPrice,
  ).toBe(10000);
});

// 카드 모델에는 별점·단가도 있다. 찜 목록 한 줄에는 그 다섯 필드만 둔다
test("찜 목록 줄의 필드만 옮긴다", () => {
  const card = {
    productId: 3,
    name: "덴탈껌",
    thumbnailUrl: null,
    price: 8000,
    originalPrice: 10000,
    rating: 4.5,
    unitPrice: 80,
  };

  expect(Object.keys(toWishlistItem(card)).sort()).toEqual([
    "name",
    "originalPrice",
    "price",
    "productId",
    "thumbnailUrl",
  ]);
});
