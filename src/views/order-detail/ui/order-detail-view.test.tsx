// 주문 상세 테스트. 카드 세 덩어리와 금액이 읽히는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { OrderDetailView } from "./order-detail-view";

test("주문정보·결제상세·배송지 정보를 나눠 보여준다", () => {
  render(<OrderDetailView />);

  for (const title of ["주문정보", "결제상세", "배송지 정보"]) {
    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  }
});

test("결제 내역을 항목별로 읽을 수 있다", () => {
  render(<OrderDetailView />);

  // 금액만 나열하면 어느 값인지 알 수 없어 dt·dd로 짝을 지운다
  expect(screen.getByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("포인트 할인")).toBeDefined();
  expect(screen.getByText("5,000원")).toBeDefined();
});

test("주문 상태를 문구로 알린다", () => {
  render(<OrderDetailView />);
  expect(screen.getByText("배송중")).toBeDefined();
});
