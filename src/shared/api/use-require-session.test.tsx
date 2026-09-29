// 로그인했으면 통과, 아니면 로그인 필요 토스트를 띄우고 막는지 본다.
import { renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";

import { clearTokens, saveTokens } from "./token-store";
import { useRequireSession } from "./use-require-session";

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError: vi.fn() }));

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
  vi.clearAllMocks();
});

test("로그인했으면 토스트 없이 통과시킨다", () => {
  saveTokens({ accessToken: "a", refreshToken: "r" });
  const { result } = renderHook(() => useRequireSession());

  expect(result.current()).toBe(true);
  expect(toastAppError).not.toHaveBeenCalled();
});

test("로그인하지 않았으면 로그인 필요 토스트를 띄우고 막는다", () => {
  const { result } = renderHook(() => useRequireSession());

  expect(result.current()).toBe(false);
  expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
});
