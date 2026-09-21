// searchProducts 단위 테스트. 요청 파라미터 조립과 응답 필드 매핑을 본다.
import { afterEach, describe, expect, it, test, vi } from "vitest";

import { getProductSummary, searchProducts } from "./products";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("searchProducts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keyword·sort와 함께 임시 페이지 크기(20)를 쿼리로 보낸다", async () => {
    const fetchMock = stubFetch(
      Response.json({ items: [], nextCursor: null, hasNext: false, totalCount: 0 }),
    );

    await searchProducts({ keyword: "사료", sort: "PRICE_ASC" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products/search?keyword=%EC%82%AC%EB%A3%8C&sort=PRICE_ASC&size=20");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("응답 필드를 화면 모델로 옮기고 nextCursor·hasNext·totalCount를 보존한다", async () => {
    stubFetch(
      Response.json({
        items: [
          {
            productId: 1,
            thumbnailUrl: "https://example.com/a.jpg",
            productName: "오리&고구마 사료",
            discountRate: 25,
            price: 24000,
            unitPrice: 960,
            unitLabel: "1kg당",
            avgRating: 4.8,
            reviewCount: 108,
          },
        ],
        nextCursor: "abc",
        hasNext: true,
        totalCount: 42,
      }),
    );

    const result = await searchProducts({ keyword: "사료", sort: "RECOMMEND" });

    expect(result).toEqual({
      items: [
        {
          productId: 1,
          name: "오리&고구마 사료",
          thumbnailUrl: "https://example.com/a.jpg",
          price: 24000,
          discountRate: 25,
          unitPrice: 960,
          unitLabel: "1kg당",
          rating: 4.8,
          reviewCount: 108,
        },
      ],
      totalCount: 42,
      nextCursor: "abc",
      hasNext: true,
    });
  });
});

test("상품 요약은 이름과 첫 사진만 옮기고 사진이 없으면 키를 두지 않는다", async () => {
  const detail = {
    productId: 7,
    timeDealItemId: null,
    summary: { images: [], productName: "오메가3 피쉬오일 60캡슐" },
    detailInfo: {},
  };
  const fetchMock = vi.fn().mockResolvedValue(Response.json(detail));
  vi.stubGlobal("fetch", fetchMock);

  const summary = await getProductSummary("7");

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/products/7");
  expect(summary).toEqual({ productId: 7, name: "오메가3 피쉬오일 60캡슐" });
  expect("imageUrl" in summary).toBe(false);
  vi.unstubAllGlobals();
});
