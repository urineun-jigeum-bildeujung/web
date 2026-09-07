// 품종 선택 테스트. 종별 묶음과 선택 전달을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { BreedPicker } from "./breed-picker";

test("강아지와 고양이를 따로 묶어 보여준다", () => {
  render(<BreedPicker onChange={() => {}} />);

  expect(screen.getByRole("heading", { name: "강아지" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "고양이" })).toBeDefined();
});

test("품종을 고르면 종과 함께 넘긴다", () => {
  const onChange = vi.fn();
  render(<BreedPicker onChange={onChange} />);

  fireEvent.click(screen.getByRole("button", { name: "코리안 숏헤어" }));
  expect(onChange).toHaveBeenCalledWith("코리안 숏헤어", "cat");
});

test("고른 품종을 aria-pressed로 알린다", () => {
  render(<BreedPicker value="말티즈" onChange={() => {}} />);

  expect(screen.getByRole("button", { name: "말티즈" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "비글" }).getAttribute("aria-pressed")).toBe("false");
});

// "기타"가 강아지·고양이 양쪽에 있다. 이름만으로는 가를 수 없다
test("기타는 양쪽 묶음에 다 있다", () => {
  render(<BreedPicker onChange={() => {}} />);

  expect(screen.getAllByRole("button", { name: "기타" })).toHaveLength(2);
});
