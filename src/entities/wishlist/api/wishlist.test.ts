// getWishlist·toggleWishlist 단위 테스트. 요청 파라미터 조립과 응답 필드 매핑을 본다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { getWishlist, toggleWishlist } from "./wishlist";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getWishlist", () => {
  it("categoryCode를 안 넘기면 category 쿼리 없이 부른다", async () => {
    const fetchMock = stubFetch(Response.json([]));

    await getWishlist();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/v1/members/me/wishlist");
  });

  it("categoryCode를 그대로 category 쿼리로 넘긴다", async () => {
    const fetchMock = stubFetch(Response.json([]));

    await getWishlist("TREAT");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/v1/members/me/wishlist?category=TREAT");
  });

  it("응답 필드를 화면 모델로 옮긴다", async () => {
    stubFetch(
      Response.json([
        {
          productId: 1,
          thumbnailUrl: "https://example.com/a.jpg",
          wished: true,
          productName: "오리&고구마 사료",
          price: 24000,
          originalPrice: 30000,
          reviewScore: null,
          reviewCount: 0,
        },
      ]),
    );

    const items = await getWishlist();

    expect(items).toEqual([
      {
        productId: 1,
        name: "오리&고구마 사료",
        thumbnailUrl: "https://example.com/a.jpg",
        price: 24000,
        originalPrice: 30000,
      },
    ]);
  });

  // 할인하지 않는 상품도 정가가 저장돼 있어 판매가와 같은 값이 온다(백엔드 확인)
  it("할인이 없으면 정가가 판매가와 같은 값으로 온다", async () => {
    stubFetch(
      Response.json([
        {
          productId: 1,
          thumbnailUrl: null,
          wished: true,
          productName: "오리&고구마 사료",
          price: 24000,
          originalPrice: 24000,
          reviewScore: null,
          reviewCount: 0,
        },
      ]),
    );

    const items = await getWishlist();

    expect(items[0].originalPrice).toBe(24000);
  });
});

describe("toggleWishlist", () => {
  it("본문 없이 PATCH로 부르고 wished를 그대로 돌려준다", async () => {
    const fetchMock = stubFetch(Response.json({ wished: false }));

    const result = await toggleWishlist(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/members/me/wishlist/1");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBeUndefined();
    expect(result).toEqual({ wished: false });
  });
});
