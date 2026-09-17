// 하단 네비게이션 바가 현재 경로에 맞는 탭을 표시하는지 본다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { BottomNav } from "./bottom-nav";

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
});
