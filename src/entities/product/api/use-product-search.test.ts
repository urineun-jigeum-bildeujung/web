// useProductSearch 단위 테스트. 커서 이어 붙이기·개수 유지·중복 제거·실패와 다시 시도를 본다.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProductSearchResult } from "./products";
import { useProductSearch } from "./use-product-search";

const PUPPY = {
  productId: 4,
  name: "퍼피 성장기 사료 1kg",
  thumbnailUrl: null,
  price: 21000,
  originalPrice: null,
  discountRate: 0,
  unitPrice: 21,
  unitLabel: "g",
  rating: 4.6,
  reviewCount: 109,
};

/** 서버 응답 모양(`ProductCardResponse`) */
function cardResponse(productId: number, productName: string) {
  return {
    productId,
    thumbnailUrl: null,
    productName,
    discountRate: 0,
    price: 27200,
    originalPrice: null,
    unitPrice: 27,
    unitLabel: "g",
    avgRating: 4.5,
    reviewCount: 108,
  };
}

const FIRST_PAGE: ProductSearchResult = {
  items: [PUPPY],
  totalCount: 2,
  nextCursor: "page-2",
  hasNext: true,
};

const PARAMS = { keyword: "사료", sort: "PRICE_ASC" as const };

describe("useProductSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 다음 쪽 응답은 totalCount가 null이다. 그 값으로 바꾸면 "총 null개"가 된다 (#532)
  it("다음 쪽을 이어 붙이고 중복은 빼며, 개수는 첫 쪽이 센 값을 유지한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        items: [cardResponse(4, "퍼피 성장기 사료 1kg"), cardResponse(2, "노령견 사료 1kg")],
        nextCursor: null,
        hasNext: false,
        totalCount: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProductSearch(FIRST_PAGE, PARAMS));
    await act(async () => {
      await result.current.loadMore();
    });

    // 첫 쪽을 부른 검색어·정렬 그대로 커서만 붙인다. 다르면 서버가 커서를 거절한다
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/products/search?keyword=%EC%82%AC%EB%A3%8C&sort=PRICE_ASC&cursor=page-2&size=20",
    );
    expect(result.current.items.map((item) => item.productId)).toEqual([4, 2]);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.hasNext).toBe(false);
  });

  it("다음 쪽이 실패하면 받은 목록은 두고, 다시 받는 동안에도 실패 표시를 남긴다", async () => {
    let resolveRetry: (response: Response) => void = () => {};
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ code: "ERR" }, { status: 500 }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveRetry = resolve)));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProductSearch(FIRST_PAGE, PARAMS));
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.failed).toBe(true);
    expect(result.current.items).toEqual([PUPPY]);

    // 다시 시도 버튼이 대기를 보이며 잠겨 있어야 같은 커서로 한 번 더 나가지 않는다
    let retry: Promise<void> = Promise.resolve();
    act(() => {
      retry = result.current.loadMore();
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.failed).toBe(true);

    await act(async () => {
      resolveRetry(
        Response.json({
          items: [cardResponse(2, "노령견 사료 1kg")],
          nextCursor: null,
          hasNext: false,
          totalCount: null,
        }),
      );
      await retry;
    });

    expect(result.current.failed).toBe(false);
    expect(result.current.items).toHaveLength(2);
  });

  it("다음 쪽이 없으면 불러도 요청을 보내지 않는다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useProductSearch({ ...FIRST_PAGE, nextCursor: null, hasNext: false }, PARAMS),
    );
    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
