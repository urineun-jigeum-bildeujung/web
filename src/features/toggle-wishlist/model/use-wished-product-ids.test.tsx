// useWishedProductIds 테스트. 로그인했을 때만 찜 목록을 부르고, 로그아웃이면 남은 캐시를 쓰지 않는지 본다.
import { renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const { useQueryWishlist, useSessionState } = vi.hoisted(() => ({
  useQueryWishlist: vi.fn(),
  useSessionState: vi.fn(),
}));
vi.mock("@/entities/wishlist", () => ({ useQueryWishlist }));
vi.mock("@/shared/api/use-session-state", () => ({ useSessionState }));

import { useWishedProductIds } from "./use-wished-product-ids";

const ITEMS = [
  { productId: 3, name: "덴탈껌", thumbnailUrl: null, price: 8000, originalPrice: 10000 },
  { productId: 5, name: "사료", thumbnailUrl: null, price: 20000, originalPrice: 20000 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useQueryWishlist.mockReturnValue({ items: ITEMS });
});

it("로그인했으면 전체 찜 목록에서 상품 번호를 뽑는다", () => {
  useSessionState.mockReturnValue(true);

  const { result } = renderHook(() => useWishedProductIds());

  expect([...result.current]).toEqual([3, 5]);
  expect(useQueryWishlist).toHaveBeenCalledWith(undefined, { enabled: true });
});

// 세션이 만료돼 끊겨도 캐시는 남는다. 로그아웃 상태에 전의 하트가 채워져 보이면 안 된다
it("로그아웃이면 찜 목록을 부르지 않고, 남은 캐시가 있어도 비어 있다", () => {
  useSessionState.mockReturnValue(false);

  const { result } = renderHook(() => useWishedProductIds());

  expect(result.current.size).toBe(0);
  expect(useQueryWishlist).toHaveBeenCalledWith(undefined, { enabled: false });
});
