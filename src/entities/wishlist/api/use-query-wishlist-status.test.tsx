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

// 로그아웃 상태에서 부르면 방문할 때마다 401과 재발급 시도가 헛돈다
it("enabled가 꺼져 있으면 묻지 않는다", async () => {
  const { result } = renderHook(() => useQueryWishlistStatus(7, { enabled: false }), { wrapper });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(getWishlistStatus).not.toHaveBeenCalled();
  expect(result.current.wished).toBeUndefined();
});
