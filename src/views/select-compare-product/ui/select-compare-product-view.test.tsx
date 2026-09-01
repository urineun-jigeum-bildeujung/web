// 비교할 상품 고르기 테스트. 고르기 전과 후, 검색했을 때를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SelectCompareProductView } from "./select-compare-product-view";

function submitButton() {
  return screen.getByRole("button", { name: "선택 완료" }) as HTMLButtonElement;
}

test("고르기 전에는 선택 완료가 꺼져 있다", () => {
  render(<SelectCompareProductView />);
  expect(submitButton().disabled).toBe(true);
});

test("상품을 고르면 선택 완료가 켜진다", () => {
  render(<SelectCompareProductView />);

  fireEvent.click(screen.getAllByRole("button", { name: /상품명/ })[0]);
  expect(submitButton().disabled).toBe(false);
});

test("검색하면 최근 봤어요 제목이 사라진다", () => {
  render(<SelectCompareProductView />);
  expect(screen.getByRole("heading", { name: "최근 봤어요" })).toBeDefined();

  // 검색 결과는 최근 본 것이 아니므로 그 제목을 달면 틀린 말이 된다
  fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "상품" } });
  expect(screen.queryByRole("heading", { name: "최근 봤어요" })).toBeNull();
});

test("찾는 것이 없으면 빈 상태를 보여준다", () => {
  render(<SelectCompareProductView />);

  fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "없는상품" } });
  expect(screen.getByText("찾는 상품이 없어요")).toBeDefined();
});
