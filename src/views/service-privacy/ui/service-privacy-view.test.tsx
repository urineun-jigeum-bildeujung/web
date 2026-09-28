// 개인정보 처리방침 테스트. 기능정의서가 적은 네 가지가 빠지지 않았는지 본다.
import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { ServicePrivacyView } from "./service-privacy-view";

test("시행일과 수집 항목·수집 목적·보유 기간이 목차와 본문에 있다", () => {
  render(<ServicePrivacyView />);

  expect(screen.getByText("시행일 2026년 9월 1일")).toBeDefined();
  const toc = screen.getByRole("navigation", { name: "목차" });
  for (const title of ["1. 수집하는 개인정보 항목", "2. 수집·이용 목적", "3. 보유 및 이용 기간"]) {
    expect(within(toc).getByRole("link", { name: title })).toBeDefined();
    expect(screen.getByRole("region", { name: title })).toBeDefined();
  }
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});

test("아이의 건강 정보를 수집 항목에 밝힌다", () => {
  render(<ServicePrivacyView />);

  const items = screen.getByRole("region", { name: "1. 수집하는 개인정보 항목" });
  expect(items.textContent).toContain("알레르기");
});
