// 품종 선택 테스트. 이미 고른 값을 다시 열었을 때 종이 유지되는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { BreedPickerStep } from "./breed-picker-step";

test("고양이 품종을 고른 값으로 다시 열면 그 품종이 눌린 채로 나온다", () => {
  render(<BreedPickerStep value="랙돌" onConfirm={vi.fn()} onCancel={vi.fn()} />);

  // 종을 강아지로 고정하던 때는 고양이 품종을 찾지 못해 아무것도 눌리지 않았다.
  const picked = screen.getByRole("button", { name: "랙돌" });
  expect(picked.getAttribute("aria-pressed")).toBe("true");
});

test("선택 완료를 누르면 고른 품종과 그 종을 함께 넘긴다", () => {
  const onConfirm = vi.fn();
  render(<BreedPickerStep value="랙돌" onConfirm={onConfirm} onCancel={vi.fn()} />);

  screen.getByRole("button", { name: "선택 완료" }).click();
  expect(onConfirm).toHaveBeenCalledWith("랙돌", "cat");
});
