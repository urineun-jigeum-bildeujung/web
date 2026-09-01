// 주문 상세 테스트. 카드 세 덩어리와 금액이 읽히는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { OrderDetailView } from "./order-detail-view";

test("주문정보·결제상세·배송지 정보를 나눠 보여준다", () => {
  render(<OrderDetailView orderId="1" />);

  for (const title of ["주문정보", "결제상세", "배송지 정보"]) {
    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  }
});

test("결제 내역을 항목별로 읽을 수 있다", () => {
  render(<OrderDetailView orderId="1" />);

  // 금액만 나열하면 어느 값인지 알 수 없어 dt·dd로 짝을 지운다.
  expect(screen.getByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("포인트 할인")).toBeDefined();
  expect(screen.getByText("5,000원")).toBeDefined();
});

test("주문마다 다른 내용을 보여준다", () => {
  // 주소창의 주문 번호를 읽지 않으면 어느 주문을 눌러도 같은 화면이 나온다.
  const { unmount } = render(<OrderDetailView orderId="2" />);
  expect(screen.getByText("배송중")).toBeDefined();
  expect(screen.getByText("20260829-1234568")).toBeDefined();
  unmount();

  render(<OrderDetailView orderId="4" />);
  expect(screen.getByText("구매확정")).toBeDefined();
  expect(screen.getByText("20260829-1234570")).toBeDefined();
});
