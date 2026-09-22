// useProductList 단위 테스트. 커서 이어 붙이기·중복 제거·실패 시 기존 목록 보존을 본다.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProductList } from "./use-product-list";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const FIRST_PAGE = {
  items: [
    {
      productId: 1,
      name: "중소형견 소포장 사료 1kg",
      thumbnailUrl: null,
      price: 31500,
      discountRate: 0,
      unitPrice: 1050,
      unitLabel: "1kg당",
      rating: 4.8,
      reviewCount: 108,
    },
  ],
  nextCursor: "page-2",
  hasNext: true,
};

describe("useProductList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("첫 페이지를 그대로 초기 상태로 들고, cursor가 없으면 더 보기를 부르지 않는다", () => {
    const { result } = renderHook(() =>
      useProductList({ items: [], nextCursor: null, hasNext: false }, { sort: "POPULAR" }),
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.hasNext).toBe(false);
  });

  it("더 보기를 부르면 다음 페이지를 이어 붙이고 중복 상품은 뺀다", async () => {
    const fetchMock = stubFetch(
      Response.json({
        items: [
          // 이미 있는 productId 1은 다시 오지 않아야 하고, 새 2만 남아야 한다
          {
            productId: 1,
            productName: "중소형견 소포장 사료 1kg",
            thumbnailUrl: null,
            price: 31500,
            discountRate: 0,
            unitPrice: 1050,
            unitLabel: "1kg당",
            avgRating: 4.8,
            reviewCount: 108,
          },
          {
            productId: 2,
            productName: "노령견 저지방 소화케어 사료 1kg",
            thumbnailUrl: null,
            price: 27200,
            discountRate: 0,
            unitPrice: 1050,
            unitLabel: "1kg당",
            avgRating: 4.5,
            reviewCount: 108,
          },
        ],
        nextCursor: null,
        hasNext: false,
      }),
    );

    const { result } = renderHook(() =>
      useProductList(FIRST_PAGE, { category: "FOOD", sort: "POPULAR" }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/v1/products?category=FOOD&sort=POPULAR&cursor=page-2");
    expect(result.current.items.map((item) => item.productId)).toEqual([1, 2]);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it("더 보기가 실패하면 기존 목록은 그대로 두고 실패 상태만 켠다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("네트워크 오류")));

    const { result } = renderHook(() =>
      useProductList(FIRST_PAGE, { category: "FOOD", sort: "POPULAR" }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.items).toEqual(FIRST_PAGE.items);
    expect(result.current.failed).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("nextCursor가 없으면 더 보기를 불러도 요청을 보내지 않는다", async () => {
    const fetchMock = stubFetch(Response.json({ items: [], nextCursor: null, hasNext: false }));

    const { result } = renderHook(() =>
      useProductList(
        { items: [], nextCursor: null, hasNext: false },
        { category: "FOOD", sort: "POPULAR" },
      ),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
