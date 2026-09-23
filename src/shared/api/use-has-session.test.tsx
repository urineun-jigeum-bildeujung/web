// 토큰이 있으면 참, 세션이 끊기면 거짓으로 바뀌는지 본다.
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { clearTokens, saveTokens } from "./token-store";
import { useHasSession } from "./use-has-session";

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
});

test("토큰이 없으면 거짓, 있으면 참이고, 끊기면 거짓으로 돌아온다", () => {
  const { result, rerender } = renderHook(() => useHasSession());
  expect(result.current).toBe(false);

  saveTokens({ accessToken: "a", refreshToken: "r" });
  rerender();
  expect(result.current).toBe(true);

  act(() => clearTokens());
  expect(result.current).toBe(false);
});
