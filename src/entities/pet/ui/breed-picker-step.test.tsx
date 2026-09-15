// 품종 선택 화면 테스트. 검색창이 목록을 거르고, 줄을 누르면 바로 확정되는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { BreedPickerStep } from "./breed-picker-step";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

test("고양이 품종을 고른 값으로 다시 열면 그 품종이 표시된 채로 나온다", () => {
  render(<BreedPickerStep value="랙돌" species="cat" onConfirm={vi.fn()} onCancel={vi.fn()} />);

  expect(screen.getByRole("button", { name: "랙돌" }).getAttribute("aria-current")).toBe("true");
});

// 시안에 확인 버튼이 없다. 줄을 누르는 것이 곧 확정이다
test("줄을 누르면 고른 품종과 그 종을 함께 넘긴다", () => {
  const onConfirm = vi.fn();
  render(<BreedPickerStep value="" species="dog" onConfirm={onConfirm} onCancel={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "랙돌" }));
  expect(onConfirm).toHaveBeenCalledWith("랙돌", "cat");
  expect(screen.queryByRole("button", { name: "선택 완료" })).toBeNull();
});

test("검색창에 치면 목록이 걸러지고 지우면 돌아온다", () => {
  render(<BreedPickerStep value="" species="dog" onConfirm={vi.fn()} onCancel={vi.fn()} />);

  const search = screen.getByLabelText("품종 검색");
  fireEvent.change(search, { target: { value: "말티" } });
  expect(screen.queryByRole("button", { name: "비글" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "입력 지우기" }));
  expect(screen.getByRole("button", { name: "비글" })).toBeDefined();
});

test("머리말의 뒤로가기가 부르던 화면으로 돌려보낸다", () => {
  const onCancel = vi.fn();
  render(<BreedPickerStep value="" species="dog" onConfirm={vi.fn()} onCancel={onCancel} />);

  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));
  expect(onCancel).toHaveBeenCalledOnce();
});
