// 설정 테스트. 알림 토글과 계정 항목을 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SettingsView } from "./settings-view";

test("알림 설정에 스위치가 있다", () => {
  render(<SettingsView />);
  expect(screen.getByRole("switch", { name: "알림 설정" })).toBeDefined();
});

test("테마·로그아웃·회원탈퇴는 자리만 있고 아직 누를 수 없다", () => {
  render(<SettingsView />);

  // 셋 다 이어질 동작이 정해지지 않아 표시용 줄로 둔다.
  // 누를 수 있게 두면 눌렀을 때 아무 일도 없어 고장으로 읽힌다.
  for (const label of ["테마 설정", "로그아웃", "회원탈퇴"]) {
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.queryByRole("button", { name: new RegExp(label) })).toBeNull();
  }
});
