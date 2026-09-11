// 결제 수단 관리 테스트. 카드 목록과 관리 시트를 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { MOCK_CARDS } from "../model/mock-cards";
import { PaymentMethodsView } from "./payment-methods-view";

test("등록된 카드를 보여준다", () => {
  render(<PaymentMethodsView cards={MOCK_CARDS} />);
  expect(screen.getByRole("button", { name: /KB국민카드/ })).toBeDefined();
});

test("카드를 누르면 관리 시트가 열린다", () => {
  render(<PaymentMethodsView cards={MOCK_CARDS} />);

  fireEvent.click(screen.getByRole("button", { name: /엄마카드/ }));
  expect(screen.getByText("카드 관리")).toBeDefined();
  expect(screen.getByRole("button", { name: "카드 지우기" })).toBeDefined();
});

// 카드 목록이 늘 차 있어 빈 상태가 화면에서 도달하지 않았다(#159)
test("등록된 카드가 없으면 그 사실을 알린다", () => {
  render(<PaymentMethodsView cards={[]} />);

  expect(screen.queryByRole("button", { name: /KB국민카드/ })).toBeNull();
  expect(screen.getByText("등록된 카드가 없어요")).toBeDefined();
});
