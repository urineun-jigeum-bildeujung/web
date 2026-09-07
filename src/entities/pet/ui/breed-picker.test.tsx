// 품종 선택 테스트. 종별 묶음과 선택 전달을 검증한다.
import { fireEvent, render, screen, within } from "@testing-library/react";
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

// "기타"가 강아지·고양이 양쪽에 있다. 개수만 세면 둘 다 한쪽에 있어도 통과하므로
// 묶음 안으로 좁혀서 본다
test("기타가 종별 묶음에 하나씩 있고 누르면 그 종을 넘긴다", () => {
  const onChange = vi.fn();
  render(<BreedPicker onChange={onChange} />);

  const dog = within(screen.getByRole("region", { name: "강아지" }));
  const cat = within(screen.getByRole("region", { name: "고양이" }));

  fireEvent.click(dog.getByRole("button", { name: "기타" }));
  expect(onChange).toHaveBeenLastCalledWith("기타", "dog");

  fireEvent.click(cat.getByRole("button", { name: "기타" }));
  expect(onChange).toHaveBeenLastCalledWith("기타", "cat");
});
