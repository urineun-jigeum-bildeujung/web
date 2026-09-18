// 세션이 끝났을 때 로그인으로 보내는지, 로그인 화면에서는 가만히 있는지 본다.
import { render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { clearTokens, saveTokens } from "@/shared/api/token-store";

const replace = vi.fn();
let pathname = "/mypage";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => pathname,
}));

import { SessionExpiryRedirect } from "./session-expiry-redirect";

afterEach(() => {
  replace.mockClear();
  clearTokens();
  window.localStorage.clear();
});

// 목록 하나가 조용히 비어 보이면 보호자는 왜 안 되는지 알지 못한다
test("세션이 끝나면 로그인으로 보낸다", () => {
  saveTokens({ accessToken: "a", refreshToken: "r" });
  render(<SessionExpiryRedirect />);

  clearTokens();

  expect(replace).toHaveBeenCalledWith("/login");
});

test("로그인 화면에서는 보내지 않는다", () => {
  pathname = "/login";
  saveTokens({ accessToken: "a", refreshToken: "r" });
  render(<SessionExpiryRedirect />);

  clearTokens();

  expect(replace).not.toHaveBeenCalled();
  pathname = "/mypage";
});

// 이미 비어 있는데도 알리면 로그아웃 뒤 요청마다 로그인으로 튕긴다
test("세션이 없던 상태에서는 아무 일도 하지 않는다", () => {
  render(<SessionExpiryRedirect />);

  clearTokens();

  expect(replace).not.toHaveBeenCalled();
});
