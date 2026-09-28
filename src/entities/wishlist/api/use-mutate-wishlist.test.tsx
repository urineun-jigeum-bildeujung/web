// useMutateWishlist 훅 테스트. 해제·토글이 찜 목록(전체·카테고리별)과 찜 여부를 함께 먼저 바꾸고,
// 실패하면 되돌리며, 마지막 요청이 끝날 때 둘 다 재동기화하는지 본다.
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
  { productId: 1, name: "사료", thumbnailUrl: null, price: 10000, originalPrice: 12000 },
  { productId: 2, name: "간식", thumbnailUrl: null, price: 5000, originalPrice: 5000 },
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

  // 먼저 끝난 해제가 곧장 무효화를 걸면, 아직 반영되지 않은 뒤 상품이 담긴 목록을
  // 받아 덮어써 그 상품이 되살아난다 (CodeRabbit 지적)
  it("다른 해제가 진행 중이면 재동기화하지 않고 마지막 하나가 끝난 뒤에 한다", async () => {
    let resolveSecond!: (value: { wished: boolean }) => void;
    toggleWishlist.mockResolvedValueOnce({ wished: false });
    toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
    );

    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1); // 먼저 끝난다
    result.current.remove(2); // 아직 진행 중이다

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(invalidate).not.toHaveBeenCalled();

    resolveSecond({ wished: false });

    // 찜 목록과 찜 여부를 함께 맞춘다. 한쪽만 맞추면 1분 안에 돌아온 화면이 틀린 하트를 보인다 (#483)
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.user.likesAll() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.user.wishlistStatusAll() });
  });

  // 좋아요 탭에서 뺀 상품을 1분 안에 상세로 다시 열면 채운 하트가 남아, 누르면 다시 찜됐다 (#483)
  it("해제하면 그 상품의 찜 여부도 비운다", async () => {
    toggleWishlist.mockResolvedValue({ wished: false });
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.user.wishlistStatus(1), true);
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.remove(1);

    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(1))).toBe(false));
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

describe("useMutateWishlist().toggle", () => {
  const NEW_ITEM: WishlistItem = {
    productId: 3,
    name: "덴탈껌",
    thumbnailUrl: null,
    price: 8000,
    originalPrice: 10000,
  };

  it("켜면 찜 여부를 먼저 채우고, 준 줄을 전체 목록 끝에 붙인다", async () => {
    toggleWishlist.mockResolvedValue({ wished: true });
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 3, wished: true, item: NEW_ITEM });

    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(3))).toBe(true));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([...ITEMS, NEW_ITEM]);
    // 응답에 상품 카테고리가 없어 어느 카테고리 목록에 들어갈지 모른다
    expect(client.getQueryData(QUERY_KEYS.user.likes("FOOD"))).toEqual([ITEMS[0]]);
  });

  // 가격 없는 줄을 넣으면 좋아요 탭이 재동기화 전까지 0원을 그린다
  it("줄을 주지 않으면 목록은 건드리지 않는다", async () => {
    toggleWishlist.mockResolvedValue({ wished: true });
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 3, wished: true });

    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(3))).toBe(true));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual(ITEMS);
  });

  it("끄면 찜 여부를 먼저 비우고 모든 목록에서 뺀다", async () => {
    toggleWishlist.mockResolvedValue({ wished: false });
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.user.wishlistStatus(1), true);
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 1, wished: false });

    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(1))).toBe(false));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual([ITEMS[1]]);
    expect(client.getQueryData(QUERY_KEYS.user.likes("FOOD"))).toEqual([]);
  });

  it("켜기가 실패하면 찜 여부와 붙인 줄을 되돌린다", async () => {
    toggleWishlist.mockRejectedValue(new Error("네트워크 오류"));
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.user.wishlistStatus(3), false);
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 3, wished: true, item: NEW_ITEM });

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(3))).toBe(false));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual(ITEMS);
  });

  it("끄기가 실패하면 뺀 줄을 제자리에 되돌린다", async () => {
    toggleWishlist.mockRejectedValue(new Error("네트워크 오류"));
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.user.wishlistStatus(1), true);
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 1, wished: false });

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(1))).toBe(true));
    expect(client.getQueryData(QUERY_KEYS.user.likes(undefined))).toEqual(ITEMS);
    expect(client.getQueryData(QUERY_KEYS.user.likes("FOOD"))).toEqual([ITEMS[0]]);
  });

  // 찜 여부를 받기 전에 누를 수 있다. 되돌릴 값이 없으면 누르기 전 화면이 보이던 값으로 둔다
  it("누르기 전 찜 여부를 몰랐는데 실패하면 뒤집기 전 값으로 둔다", async () => {
    toggleWishlist.mockRejectedValue(new Error("네트워크 오류"));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 3, wished: true });

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(3))).toBe(false));
  });

  // 같은 상품을 연달아 두 번 누르면 원래대로다. 먼저 끝난 요청이 재조회하면 둘째 요청이
  // 반영되기 전의 여부를 받아 하트를 한 번 되돌렸다가 다시 바꾼다
  it("연달아 누르면 마지막 요청이 끝난 뒤에만 재동기화한다", async () => {
    let resolveSecond!: (value: { wished: boolean }) => void;
    toggleWishlist.mockResolvedValueOnce({ wished: true });
    toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
    );
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMutateWishlist(), { wrapper });

    result.current.toggle({ productId: 3, wished: true, item: NEW_ITEM });
    result.current.toggle({ productId: 3, wished: false });

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(2));
    expect(client.getQueryData(QUERY_KEYS.user.wishlistStatus(3))).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(invalidate).not.toHaveBeenCalled();

    resolveSecond({ wished: false });

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
  });
});
