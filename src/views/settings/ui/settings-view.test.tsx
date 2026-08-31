// 설정 테스트. 알림 토글과 계정 항목을 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SettingsView } from "./settings-view";

test("알림 설정에 스위치가 있다", () => {
  render(<SettingsView />);
  expect(screen.getByRole("switch", { name: "알림 설정" })).toBeDefined();
});

test("로그아웃과 회원탈퇴가 있다", () => {
  render(<SettingsView />);

  expect(screen.getByRole("button", { name: /로그아웃/ })).toBeDefined();
  expect(screen.getByRole("button", { name: /회원탈퇴/ })).toBeDefined();
});
