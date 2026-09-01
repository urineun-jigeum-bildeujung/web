// 고객지원 테스트. 입구 링크와 FAQ 아코디언을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SupportView } from "./support-view";

test("1:1 문의와 공지사항이 각 화면으로 이어진다", () => {
  render(<SupportView />);

  expect(screen.getByRole("link", { name: /1:1 문의/ }).getAttribute("href")).toBe(
    "/mypage/support/inquiries",
  );
  expect(screen.getByRole("link", { name: /공지사항/ }).getAttribute("href")).toBe(
    "/mypage/support/notices",
  );
});

test("자주 묻는 질문은 접혀 있다가 눌러야 펼쳐진다", () => {
  render(<SupportView />);

  const trigger = screen.getByRole("button", { name: "배송은 보통 며칠이나 걸리나요?" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});
