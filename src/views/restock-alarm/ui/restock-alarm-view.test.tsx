// 재입고 알림 테스트. 목록 모드와 고르는 모드 전환을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { RestockAlarmView } from "./restock-alarm-view";

test("목록 모드에서는 안내와 검색, 상품 더 찾아보기를 보여준다", () => {
  render(<RestockAlarmView />);

  expect(screen.getByText(/재입고 시 상품 가격이나 구성이/)).toBeDefined();
  expect(screen.getByLabelText("재입고 알림 검색")).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 더 찾아보기" })).toBeDefined();
});

test("수정하기를 누르면 고르는 모드로 바뀐다", () => {
  render(<RestockAlarmView />);

  fireEvent.click(screen.getByRole("button", { name: "수정하기" }));

  // 안내와 검색이 사라지고 취소 버튼이 나온다
  expect(screen.queryByText(/재입고 시 상품 가격이나 구성이/)).toBeNull();
  expect(screen.getByRole("button", { name: "알림 취소하기" })).toBeDefined();
});

test("아무것도 고르지 않으면 알림 취소하기가 꺼져 있다", () => {
  render(<RestockAlarmView />);
  fireEvent.click(screen.getByRole("button", { name: "수정하기" }));

  const cancel = screen.getByRole("button", { name: "알림 취소하기" }) as HTMLButtonElement;
  expect(cancel.disabled).toBe(true);

  fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]);
  expect(cancel.disabled).toBe(false);
});

test("검색 결과가 없으면 빈 상태를 보여준다", () => {
  render(<RestockAlarmView />);

  fireEvent.change(screen.getByLabelText("재입고 알림 검색"), { target: { value: "없는상품" } });
  expect(screen.getByText("재입고 알림을 신청한 상품이 없어요")).toBeDefined();
});
