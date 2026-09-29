// useToggleWishlist 테스트. 로그인 여부에 따라 찜을 뒤집거나 로그인 필요 토스트를 띄우는지 본다.
import { renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const { toastAppError, toggle, useSessionState } = vi.hoisted(() => ({
  toastAppError: vi.fn(),
  toggle: vi.fn(),
  useSessionState: vi.fn(),
}));
vi.mock("@/shared/lib/app-toast", () => ({ toastAppError }));
vi.mock("@/entities/wishlist", () => ({ useMutateWishlist: () => ({ toggle }) }));
vi.mock("@/shared/api/use-session-state", () => ({ useSessionState }));

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { useToggleWishlist } from "./use-toggle-wishlist";

const ITEM = {
  productId: 3,
  name: "덴탈껌",
  thumbnailUrl: null,
  price: 8000,
  originalPrice: 10000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

it("로그인했으면 찜을 뒤집고 true를 돌려준다", () => {
  useSessionState.mockReturnValue(true);
  const { result } = renderHook(() => useToggleWishlist());

  expect(result.current.signedIn).toBe(true);
  expect(result.current.toggle(3, true, ITEM)).toBe(true);
  expect(toggle).toHaveBeenCalledWith({ productId: 3, wished: true, item: ITEM });
  expect(toastAppError).not.toHaveBeenCalled();
});

it("로그인하지 않았으면 찜 대신 로그인 필요 토스트를 띄운다", () => {
  useSessionState.mockReturnValue(false);
  const { result } = renderHook(() => useToggleWishlist());

  expect(result.current.signedIn).toBe(false);
  expect(result.current.toggle(3, true)).toBe(false);
  expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
  expect(toggle).not.toHaveBeenCalled();
});

// 하이드레이션 중에는 로그인 여부를 모른다. 로그인한 사람에게 로그인하라고 띄우면 안 된다
it("로그인 여부를 아직 모르면 아무것도 하지 않는다", () => {
  useSessionState.mockReturnValue(null);
  const { result } = renderHook(() => useToggleWishlist());

  expect(result.current.signedIn).toBe(false);
  expect(result.current.toggle(3, true)).toBe(false);
  expect(toastAppError).not.toHaveBeenCalled();
  expect(toggle).not.toHaveBeenCalled();
});
