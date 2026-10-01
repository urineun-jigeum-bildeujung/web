// getWishlist·getWishlistStatus·toggleWishlist 단위 테스트. 요청 파라미터 조립과 응답 필드 매핑을 본다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { getWishlist, getWishlistStatus, toggleWishlist } from "./wishlist";

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

  // `Product.originalPrice` 열이 NULL을 허용하고 `WishlistService`가 그 값을 그대로 통과시킨다.
  // 전에는 타입이 `number`라 이 경우가 가려져 있었다 (#630)
  it("정가가 비어 오면 그대로 null로 옮긴다", async () => {
    stubFetch(
      Response.json([
        {
          productId: 1,
          thumbnailUrl: null,
          wished: true,
          productName: "정가 없는 사료",
          price: 24000,
          originalPrice: null,
          reviewScore: null,
          reviewCount: 0,
        },
      ]),
    );

    const items = await getWishlist();

    expect(items[0].originalPrice).toBeNull();
  });
});

describe("getWishlistStatus", () => {
  it("상품 번호로 찜 여부를 묻고 wished만 돌려준다", async () => {
    const fetchMock = stubFetch(Response.json({ wished: true }));

    const wished = await getWishlistStatus(7);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/members/me/wishlist/status/7");
    expect(init.method).toBeUndefined();
    expect(wished).toBe(true);
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
