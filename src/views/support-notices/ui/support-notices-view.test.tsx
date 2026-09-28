// 공지사항 테스트. 최신 공지가 위로 오고, 제목을 눌러야 본문이 펼쳐지는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SupportNoticesView } from "./support-notices-view";

test("최신 공지가 위로 오고 게시일이 함께 보인다", () => {
  render(<SupportNoticesView />);

  // 머리말의 뒤로가기를 빼고 펼치는 버튼만 본다
  const titles = screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-expanded"))
    .map((button) => button.textContent);
  expect(titles[0]).toContain("타임딜 운영 안내");
  expect(titles[0]).toContain("26.09.10");
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});

test("공지는 접혀 있다가 제목을 눌러야 펼쳐진다", () => {
  render(<SupportNoticesView />);

  const trigger = screen.getByRole("button", { name: /타임딜 운영 안내/ });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText(/정해진 수량만 딜 가격으로 판매해요/)).toBeDefined();
});
