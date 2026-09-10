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

// 결제는 되돌릴 수 없다. 필수 동의 없이 눌리면 무엇에 동의했는지 모르는 채로 돈이 나간다.
test("필수 약관에 동의해야 결제할 수 있다", () => {
  render(<CheckoutView />);

  const pay = screen.getByRole("button", { name: "결제하기" });
  expect(pay.hasAttribute("disabled")).toBe(true);

  for (const label of [
    "[필수] 주문 상품 정보 동의",
    "[필수] 개인정보 제3자 제공 동의",
    "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
  ]) {
    fireEvent.click(screen.getByLabelText(label));
  }

  // 선택 항목은 켜지 않아도 결제할 수 있다
  expect(pay.hasAttribute("disabled")).toBe(false);
});

test("전체 동의를 켜면 네 줄이 함께 켜진다", () => {
  render(<CheckoutView />);

  fireEvent.click(screen.getByLabelText("전체 동의"));

  // 이 저장소는 jest-dom을 붙이지 않아 toBeChecked가 없다. shadcn Checkbox의 상태로 본다
  expect(
    screen.getByLabelText("[선택] 다음 주문을 위해 이 결제 수단 저장").getAttribute("data-state"),
  ).toBe("checked");
  expect(screen.getByRole("button", { name: "결제하기" }).hasAttribute("disabled")).toBe(false);
});

// 시안(paym_001_직접입력)은 직접 입력을 고른 뒤에만 칸을 연다
test("직접 입력을 고르기 전에는 입력 칸이 없다", () => {
  render(<CheckoutView />);

  expect(screen.queryByLabelText("배송 요청사항 직접 입력")).toBeNull();
});
