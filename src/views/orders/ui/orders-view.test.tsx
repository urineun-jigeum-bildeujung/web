// 주문·배송 확인 테스트. 상태별 행동 버튼과 확인 창을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { OrdersView } from "./orders-view";

test("배송중 주문에는 배송 위치 보기가 나온다", () => {
  render(<OrdersView />);
  expect(screen.getByRole("button", { name: "배송 위치 보기" })).toBeDefined();
});

test("배송완료 주문에는 구매 확정하기가 나온다", () => {
  render(<OrdersView />);
  expect(screen.getAllByRole("button", { name: "구매 확정하기" }).length).toBeGreaterThan(0);
});

test("구매 확정을 누르면 확인 시트가 열린다", () => {
  render(<OrdersView />);

  fireEvent.click(screen.getAllByRole("button", { name: "구매 확정하기" })[0]);
  expect(screen.getByText("무사히 잘 도착했나요?")).toBeDefined();
  expect(screen.getByRole("button", { name: "확정하고 포인트 받기" })).toBeDefined();
});
