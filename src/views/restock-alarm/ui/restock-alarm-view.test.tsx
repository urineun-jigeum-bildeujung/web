// 재입고 알림 테스트. 고르면 취소 버튼이 나오고, 확인하면 목록에서 빠지는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { RestockAlarmView } from "./restock-alarm-view";

test("안내와 검색, 상품 목록을 보여준다", () => {
  render(<RestockAlarmView />);

  expect(screen.getByText(/재입고 시 상품 가격이나 구성이/)).toBeDefined();
  expect(screen.getByLabelText("재입고 알림 검색")).toBeDefined();
  expect(screen.getAllByRole("checkbox")).toHaveLength(3);
});

test("고른 것이 있을 때만 알림 취소하기가 나온다", () => {
  render(<RestockAlarmView />);

  expect(screen.queryByRole("button", { name: "알림 취소하기" })).toBeNull();

  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  expect(screen.getByRole("button", { name: "알림 취소하기" })).toBeDefined();
});

test("확인 창에서 취소하면 고른 상품이 목록에서 빠진다", () => {
  render(<RestockAlarmView />);

  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(screen.getByRole("button", { name: "알림 취소하기" }));

  const dialog = screen.getByRole("alertdialog");
  expect(within(dialog).getByText("정말 취소할까요?")).toBeDefined();
  fireEvent.click(within(dialog).getByRole("button", { name: "알림 취소하기" }));

  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "알림 취소하기" })).toBeNull();
});

test("검색 결과가 없으면 빈 상태를 보여준다", () => {
  render(<RestockAlarmView />);

  fireEvent.change(screen.getByLabelText("재입고 알림 검색"), { target: { value: "없는상품" } });
  expect(screen.getByText("재입고 알림을 신청한 상품이 없어요")).toBeDefined();
});
