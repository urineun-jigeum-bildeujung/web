// 서버 렌더에서는 모른다고, 브라우저에서는 토큰 유무대로 답하는지 본다.
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test } from "vitest";

import { clearTokens, saveTokens } from "./token-store";
import { useSessionState } from "./use-session-state";

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
});

function Probe() {
  return <span>{String(useSessionState())}</span>;
}

// 서버가 로그아웃 모양으로 그려 버리면 하이드레이션 뒤 로그인 모양으로 바뀌며 화면이 밀린다
test("서버 렌더에서는 토큰이 있어도 모른다(null)고 답한다", () => {
  saveTokens({ accessToken: "a", refreshToken: "r" });

  expect(renderToString(<Probe />)).toBe("<span>null</span>");
});

test("브라우저에서는 토큰 유무대로 답하고, 끊기면 거짓으로 바뀐다", () => {
  const { result, rerender } = renderHook(() => useSessionState());
  expect(result.current).toBe(false);

  saveTokens({ accessToken: "a", refreshToken: "r" });
  rerender();
  expect(result.current).toBe(true);

  act(() => clearTokens());
  expect(result.current).toBe(false);
});
