// 1:1 문의 테스트. 최신순과 상태, 답변이 있을 때만 답변을 보이는지, 문의하기가 준비 중을 알리는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { APP_MESSAGE } from "@/shared/config/app-message";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SupportInquiriesView } from "./support-inquiries-view";

/** 머리말의 뒤로가기를 빼고 펼치는 버튼만 본다 */
function inquiryTriggers() {
  return screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-expanded"));
}

test("최신 문의가 위로 오고 상태가 보인다", () => {
  render(<SupportInquiriesView />);

  // 예시 내역을 제 문의로 오해하지 않게 목록 위에 밝힌다 (#503 리뷰)
  expect(screen.getByText(/예시 내역이에요/)).toBeDefined();

  const [first, second] = inquiryTriggers().map((button) => button.textContent);
  expect(first).toContain("답변 대기");
  expect(first).toContain("반품 수거 일정 문의");
  expect(second).toContain("답변 완료");
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});

test("답변이 달린 문의만 펼쳤을 때 답변을 보인다", () => {
  render(<SupportInquiriesView />);

  fireEvent.click(screen.getByRole("button", { name: /사료 급여량이 궁금해요/ }));
  expect(screen.getByText("답변")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: /반품 수거 일정 문의/ }));
  expect(screen.getByText("답변을 준비하고 있어요.")).toBeDefined();
});

test("서비스 문의하기는 문의 창구가 준비 중임을 알린다", () => {
  render(<SupportInquiriesView />);

  fireEvent.click(screen.getByRole("button", { name: "서비스 문의하기" }));
  expect(
    screen.getByRole("dialog", { name: APP_MESSAGE["support.inquiryPreparing"].title }),
  ).toBeDefined();
});
