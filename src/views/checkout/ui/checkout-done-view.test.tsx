// 주문 완료 테스트. 무엇을 샀는지와 다음에 갈 곳이 보이는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { CheckoutDoneView } from "./checkout-done-view";

test("주문번호와 도착 예정을 알린다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(screen.getByText("20260829-1234567")).toBeDefined();
  expect(screen.getByText("모레(9/3)")).toBeDefined();
});

test("결제 내역과 배송지를 함께 남긴다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("heading", { name: "결제상세" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "배송지 정보" })).toBeDefined();
  expect(screen.getByText("토스페이")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
});

// 방금 한 주문을 바로 볼 수 있어야 주문 내역을 다시 찾아 들어가지 않는다 (paym_002)
test("주문 상세와 홈으로 갈 수 있다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("link", { name: "주문 상세 보기" }).getAttribute("href")).toBe(
    "/mypage/orders/1",
  );
  expect(screen.getByRole("link", { name: "홈으로 가기" }).getAttribute("href")).toBe("/");
});

// 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 둔다
test("뒤로가기 대신 닫기가 있다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("link", { name: "닫기" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
});
