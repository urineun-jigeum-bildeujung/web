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

test("구매를 확정하면 목록이 바뀌어 같은 버튼이 다시 나오지 않는다", () => {
  render(<OrdersView />);
  const before = screen.getAllByRole("button", { name: "구매 확정하기" }).length;

  fireEvent.click(screen.getAllByRole("button", { name: "구매 확정하기" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "확정하고 포인트 받기" }));

  // 상태를 바꾸지 않고 토스트만 띄우면 같은 주문을 계속 확정할 수 있었다
  expect(screen.queryAllByRole("button", { name: "구매 확정하기" }).length).toBe(before - 1);
});

test("주문을 취소하면 그 주문이 목록에서 사라진다", () => {
  render(<OrdersView />);
  const before = screen.getAllByRole("article").length;

  fireEvent.click(screen.getByRole("button", { name: "주문 취소" }));
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));

  expect(screen.getAllByRole("article").length).toBe(before - 1);
});

test("갈 화면이 없는 버튼은 눌리지 않는다", () => {
  render(<OrdersView />);

  // 주문 상세(mypa_161)와 배송 조회는 아직 만들지 않았다
  for (const name of ["배송 위치 보기", "자세히 보기"]) {
    const button = screen.getAllByRole("button", { name })[0] as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  }
});
