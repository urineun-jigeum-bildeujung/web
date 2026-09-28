// 세션이 없으면 로그인으로 보내고 안쪽을 그리지 않는지, 있으면 그대로 두는지 본다.
import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { clearTokens, saveTokens } from "@/shared/api/token-store";

const replace = vi.fn();
// 실제 라우터처럼 같은 객체를 돌려준다. 렌더마다 새로 만들면 효과가 다시 돌아 앞 테스트의 정리가 다음 테스트에 섞인다
const router = { replace, push: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import { SessionGuard } from "./session-guard";

afterEach(() => {
  replace.mockClear();
  clearTokens();
  window.localStorage.clear();
});

// 그리면 세션 없이 요청이 먼저 나가 오류 화면이 잠깐 비친다
test("세션이 없으면 로그인으로 보내고 안쪽을 그리지 않는다", () => {
  render(
    <SessionGuard>
      <p>내 정보</p>
    </SessionGuard>,
  );

  expect(replace).toHaveBeenCalledWith("/login");
  expect(screen.queryByText("내 정보")).toBeNull();
});

test("세션이 있으면 그대로 그린다", () => {
  saveTokens({ accessToken: "a", refreshToken: "r" });
  render(
    <SessionGuard>
      <p>내 정보</p>
    </SessionGuard>,
  );

  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByText("내 정보")).toBeDefined();
});

// 새로고침하면 accessToken은 사라지고 refreshToken만 남는다. 그 상태도 로그인이다
test("refreshToken만 남아 있어도 보내지 않는다", () => {
  window.localStorage.setItem("gollaju.refreshToken", "r");
  render(
    <SessionGuard>
      <p>내 정보</p>
    </SessionGuard>,
  );

  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByText("내 정보")).toBeDefined();
});
