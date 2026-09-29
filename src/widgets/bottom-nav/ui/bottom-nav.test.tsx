// 하단 네비게이션 바가 현재 경로에 맞는 탭을 표시하고, 비로그인에게 로그인이 필요한 탭을 막는지 본다.
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clearTokens, saveTokens } from "@/shared/api/token-store";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError: vi.fn() }));

import { BottomNav } from "./bottom-nav";

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
  vi.clearAllMocks();
});

/** 링크를 누르고, 이동이 막혔는지(preventDefault) 돌려준다 */
function click(name: string) {
  const link = screen.getByRole("link", { name });
  const event = createEvent.click(link);
  fireEvent(link, event);
  return event.defaultPrevented;
}

describe("BottomNav", () => {
  it("현재 경로의 탭에만 aria-current가 붙는다", () => {
    mockPathname = "/likes";
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "좋아요" })).toHaveProperty("ariaCurrent", "page");
    expect(screen.getByRole("link", { name: "홈" })).toHaveProperty("ariaCurrent", null);
  });

  it("루트 경로(/)는 정확히 일치할 때만 홈을 고른 것으로 본다", () => {
    mockPathname = "/likes";
    render(<BottomNav />);

    // startsWith로 보면 "/likes"도 "/"로 시작해 홈이 걸리는 실수를 막는다
    expect(screen.getByRole("link", { name: "홈" })).toHaveProperty("ariaCurrent", null);
  });

  it("비로그인이 로그인이 필요한 탭을 누르면 이동하지 않고 로그인 필요 토스트를 띄운다", () => {
    mockPathname = "/";
    render(<BottomNav />);

    expect(click("좋아요")).toBe(true);
    expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
  });

  it("비로그인도 홈 탭은 그대로 이동한다", () => {
    mockPathname = "/likes";
    render(<BottomNav />);

    expect(click("홈")).toBe(false);
    expect(toastAppError).not.toHaveBeenCalled();
  });

  // 마이페이지는 로그인하러 들어가는 입구다. 막지 않고 보내면 가드가 로그인 화면으로 보낸다
  it("비로그인이 마이페이지 탭을 누르면 토스트 없이 이동한다", () => {
    mockPathname = "/";
    render(<BottomNav />);

    expect(click("마이페이지")).toBe(false);
    expect(toastAppError).not.toHaveBeenCalled();
  });

  it("로그인했으면 막지 않는다", () => {
    saveTokens({ accessToken: "a", refreshToken: "r" });
    mockPathname = "/";
    render(<BottomNav />);

    expect(click("좋아요")).toBe(false);
    expect(toastAppError).not.toHaveBeenCalled();
  });
});
