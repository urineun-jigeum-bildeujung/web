// useQueryWishlistStatus 훅 테스트. 로그인했을 때만 묻고, 받은 여부를 그대로 돌려주는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

const { getWishlistStatus } = vi.hoisted(() => ({ getWishlistStatus: vi.fn() }));
vi.mock("./wishlist", () => ({ getWishlistStatus }));

import { useQueryWishlistStatus } from "./use-query-wishlist-status";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.clearAllMocks();
});

it("찜 여부를 받아 돌려준다", async () => {
  getWishlistStatus.mockResolvedValue(true);

  const { result } = renderHook(() => useQueryWishlistStatus(7, { enabled: true }), { wrapper });

  await waitFor(() => expect(result.current.wished).toBe(true));
  expect(getWishlistStatus).toHaveBeenCalledWith(7);
});

// 세션이 만료돼 끊겨도 캐시는 남는다. 로그아웃 상태에 전의 하트가 채워져 보이면 안 된다
it("껐다가는 받아 둔 여부도 내주지 않는다", async () => {
  getWishlistStatus.mockResolvedValue(true);

  const { result, rerender } = renderHook(({ enabled }) => useQueryWishlistStatus(7, { enabled }), {
    wrapper,
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current.wished).toBe(true));

  rerender({ enabled: false });

  expect(result.current.wished).toBeUndefined();
});

// 로그아웃 상태에서 부르면 방문할 때마다 401과 재발급 시도가 헛돈다
it("enabled가 꺼져 있으면 묻지 않는다", async () => {
  const { result } = renderHook(() => useQueryWishlistStatus(7, { enabled: false }), { wrapper });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(getWishlistStatus).not.toHaveBeenCalled();
  expect(result.current.wished).toBeUndefined();
});

// 모르는 채로 누르면 토글이 서버의 찜을 지울 수 있다. 받는 동안임을 화면에 넘긴다 (#493 리뷰)
it("받는 동안은 받는 중이고, 꺼 두면 받는 중이 아니다", async () => {
  getWishlistStatus.mockResolvedValue(false);

  const { result } = renderHook(() => useQueryWishlistStatus(7, { enabled: true }), { wrapper });
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  const off = renderHook(() => useQueryWishlistStatus(7, { enabled: false }), { wrapper });
  expect(off.result.current.isLoading).toBe(false);
});
