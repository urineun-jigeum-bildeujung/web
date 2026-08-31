// 결제 수단 관리 테스트. 카드 목록과 관리 시트를 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { PaymentMethodsView } from "./payment-methods-view";

test("등록된 카드를 보여준다", () => {
  render(<PaymentMethodsView />);
  expect(screen.getByRole("button", { name: /KB국민카드/ })).toBeDefined();
});

test("카드를 누르면 관리 시트가 열린다", () => {
  render(<PaymentMethodsView />);

  fireEvent.click(screen.getByRole("button", { name: /엄마카드/ }));
  expect(screen.getByText("카드 관리")).toBeDefined();
  expect(screen.getByRole("button", { name: "카드 지우기" })).toBeDefined();
});
