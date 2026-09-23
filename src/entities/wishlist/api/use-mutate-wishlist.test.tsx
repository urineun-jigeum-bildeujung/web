// useMutateWishlist 훅 테스트. 전체·카테고리별 캐시를 모두 낙관적으로 갱신하고,
// 실패하면 둘 다 되돌리는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { toggleWishlist } = vi.hoisted(() => ({ toggleWishlist: vi.fn() }));
vi.mock("./wishlist", () => ({ toggleWishlist }));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { useMutateWishlist } from "./use-mutate-wishlist";
import type { WishlistItem } from "./wishlist";

const ITEMS: WishlistItem[] = [
  { productId: 1, name: "사료", thumbnailUrl: null, price: 10000 },
  { productId: 2, name: "간식", thumbnailUrl: null, price: 5000 },
];

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(QUERY_KEYS.user.likes(undefined), ITEMS);
  client.setQueryData(QUERY_KEYS.user.likes("FOOD"), [ITEMS[0]]);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useMutateWishlist", () => {
  it("전체·카테고리별 캐시 모두에서 즉시 뺀다", async () => {
    toggleWishlist.mockResolvedValue({ wished: false });
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1);

    await waitFor(() =>
      expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([ITEMS[1]]),
    );
    expect(client.getQueryData(QUERY_KEYS.user.likes("FOOD"))).toEqual([]);
  });

  it("실패하면 전체·카테고리별 캐시 모두 되돌린다", async () => {
    toggleWishlist.mockRejectedValue(new Error("네트워크 오류"));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1);

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual(ITEMS),
    );
    expect(client.getQueryData(QUERY_KEYS.user.likes("FOOD"))).toEqual([ITEMS[0]]);
  });

  // 전체 스냅샷으로 되돌리면 그사이 성공한 다른 상품까지 되살아난다 — 실패한
  // 상품 하나만 복원해야 한다
  it("한 상품이 나중에 실패해도 그사이 성공한 다른 상품은 그대로 빠져 있다", async () => {
    let rejectFirst!: (error: Error) => void;
    toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    toggleWishlist.mockResolvedValueOnce({ wished: false });

    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1); // 나중에 실패할 것
    result.current.remove(2); // 먼저 성공할 것

    // 둘 다 낙관적으로 빠진다
    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([]));
    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(2));

    rejectFirst(new Error("네트워크 오류"));

    // 상품 1만 되돌아오고, 이미 성공한 상품 2는 다시 나타나지 않는다
    await waitFor(() =>
      expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([ITEMS[0]]),
    );
  });

  it("실패한 상품이 이미 캐시에 돌아와 있으면 중복으로 넣지 않는다", async () => {
    let rejectFirst!: (error: Error) => void;
    toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );

    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1);
    await waitFor(() =>
      expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([ITEMS[1]]),
    );

    // 그사이 다른 경로(예: 백그라운드 재조회)로 상품 1이 이미 캐시에 돌아왔다고 가정
    client.setQueryData(QUERY_KEYS.user.likes(undefined), ITEMS);

    rejectFirst(new Error("네트워크 오류"));

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    // 중복 삽입됐다면 상품 1이 두 번 들어가 길이가 3이 된다
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual(ITEMS);
  });

  it("재시도하지 않는다", async () => {
    toggleWishlist.mockRejectedValue(new Error("네트워크 오류"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1);

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    // 재시도가 있었다면 여기서 2 이상이 된다
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toggleWishlist).toHaveBeenCalledTimes(1);
  });
});
