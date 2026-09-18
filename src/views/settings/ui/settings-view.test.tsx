// 설정 테스트. 알림 토글과 계정 항목, 로그아웃을 검증한다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));

import { hasSession, saveTokens } from "@/shared/api/token-store";

import { SettingsView } from "./settings-view";

function renderView() {
  return render(<SettingsView />, { wrapper: createQueryWrapper() });
}

beforeEach(() => {
  toastAppError.mockClear();
  saveTokens({ accessToken: "a", refreshToken: "r" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test("알림설정에 스위치가 있다", () => {
  renderView();
  expect(screen.getByRole("switch", { name: "알림설정" })).toBeDefined();
});

test("테마·회원탈퇴는 자리만 있고 아직 누를 수 없다", () => {
  renderView();

  // 이어질 동작이 정해지지 않아 표시용 줄로 둔다. 누를 수 있게 두면 눌렀을 때
  // 아무 일도 없어 고장으로 읽힌다. 회원탈퇴는 API가 아직 없다
  for (const label of ["테마설정", "회원탈퇴"]) {
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.queryByRole("button", { name: new RegExp(label) })).toBeNull();
  }
});

// 기기에서만 지우면 서버의 refreshToken이 살아 있어 그것을 쥔 쪽이 계속 재발급을 받는다
test("로그아웃을 누르면 서버에 알리고 토큰을 지운다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

  await waitFor(() => expect(hasSession()).toBe(false));
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/auths/logout");
  expect(init.method).toBe("POST");
});

// 서버 정리에 실패했다고 로그아웃을 막으면 남의 기기에서 빠져나올 방법이 없어진다
test("서버 정리에 실패해도 기기의 토큰은 지운다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(hasSession()).toBe(false);
});
