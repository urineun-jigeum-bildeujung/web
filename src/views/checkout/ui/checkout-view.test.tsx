// 결제하기 테스트. 결제 수단 고르기와 금액 표시를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { CheckoutView } from "./checkout-view";

test("결제 내역을 항목별로 읽을 수 있다", () => {
  render(<CheckoutView />);

  expect(screen.getByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("주문 수량 1개")).toBeDefined();
});

test("페이결제를 고르면 어느 페이인지 다시 묻는다", () => {
  render(<CheckoutView />);

  // 시안은 페이결제일 때만 세 칸을 보여준다
  expect(screen.getByRole("radiogroup", { name: "페이 종류" })).toBeDefined();

  fireEvent.click(screen.getByRole("radio", { name: "무통장입금" }));
  expect(screen.queryByRole("radiogroup", { name: "페이 종류" })).toBeNull();
});

test("페이 종류를 바꾸면 그것이 골라진다", () => {
  render(<CheckoutView />);

  const naver = screen.getByRole("radio", { name: "네이버페이" });
  fireEvent.click(naver);
  expect(naver.getAttribute("aria-checked")).toBe("true");
});
