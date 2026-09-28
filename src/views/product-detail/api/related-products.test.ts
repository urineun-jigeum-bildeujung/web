// "함께 보면 좋은 상품"이 몇 개를 받아 지금 상품을 빼고 몇 개를 남기는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getRelatedProducts, MAX_RELATED } from "./related-products";

const card = (productId: number) => ({
  productId,
  thumbnailUrl: null,
  productName: `상품 ${productId}`,
  discountRate: 0,
  price: 10_000,
  originalPrice: null,
  unitPrice: 10,
  unitLabel: "g",
  avgRating: 4.5,
  reviewCount: 3,
});

function stubProducts(ids: number[]) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json({ items: ids.map(card), nextCursor: null, hasNext: false }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

// 자르는 일은 서버가 한다. 지금 상품이 섞여 와도 여섯을 채우도록 하나 더 받는다
test("인기순으로 여섯에 하나를 더 받는다", async () => {
  const fetchMock = stubProducts([]);

  await getRelatedProducts(1);

  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toBe(`/api/v1/products?sort=POPULAR&size=${MAX_RELATED + 1}`);
});

test("지금 보는 상품은 뺀다", async () => {
  stubProducts([3, 1, 5]);

  const related = await getRelatedProducts(1);

  expect(related.map((item) => item.productId)).toEqual([3, 5]);
});

test("지금 상품이 섞이지 않았으면 여섯까지만 남긴다", async () => {
  stubProducts([2, 3, 4, 5, 6, 7, 8]);

  const related = await getRelatedProducts(1);

  expect(related.map((item) => item.productId)).toEqual([2, 3, 4, 5, 6, 7]);
});
