// 주문 상세 테스트. 카드 세 덩어리와 금액이 읽히는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
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

// 배송이 끝나야 반품·교환을 접수할 수 있다. 배송 전에는 주문 취소가 맞는 길이다
test("배송완료가 아니면 반품·교환 버튼이 없다", () => {
  render(<OrderDetailView orderId="1" />);

  expect(screen.queryByRole("button", { name: "반품하기" })).toBeNull();
  expect(screen.queryByRole("button", { name: "교환하기" })).toBeNull();
});

test("배송완료면 반품·교환을 접수할 수 있다", () => {
  render(<OrderDetailView orderId="3" />);

  expect(screen.getByRole("button", { name: "반품하기" })).toBeDefined();
  expect(screen.getByRole("button", { name: "교환하기" })).toBeDefined();
});

// 접수하면 기사가 상품을 가지러 온다. 누르는 순간 접수되는 것처럼 보이면 안 된다
test("반품과 교환은 수거 뒤에 오는 것이 달라 설명도 다르다", () => {
  render(<OrderDetailView orderId="3" />);

  fireEvent.click(screen.getByRole("button", { name: "반품하기" }));
  expect(screen.getByText(/바로 환불해 드릴게요/)).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  fireEvent.click(screen.getByRole("button", { name: "교환하기" }));
  expect(screen.getByText(/새 상품을 보내드릴게요/)).toBeDefined();
});
