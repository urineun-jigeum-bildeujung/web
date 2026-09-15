// 품종 목록 테스트. 검색 전 종별 묶음, 검색어로 거르기, 줄을 누르면 종과 함께 넘기는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { BreedPicker } from "./breed-picker";

test("검색어가 없으면 강아지와 고양이를 따로 묶어 전부 보여준다", () => {
  render(<BreedPicker query="" onPick={() => {}} />);

  expect(screen.getByRole("heading", { name: "강아지" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "고양이" })).toBeDefined();
  expect(screen.getByRole("button", { name: "말티즈" })).toBeDefined();
  expect(screen.getByRole("button", { name: "코리안 숏헤어" })).toBeDefined();
});

test("줄을 누르면 품종과 종을 함께 넘긴다", () => {
  const onPick = vi.fn();
  render(<BreedPicker query="" onPick={onPick} />);

  fireEvent.click(screen.getByRole("button", { name: "코리안 숏헤어" }));
  expect(onPick).toHaveBeenCalledWith("코리안 숏헤어", "cat");
});

test("검색어를 치면 들어맞는 품종만 남는다", () => {
  render(<BreedPicker query="말티" onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "말티즈" })).toBeDefined();
  expect(screen.getByRole("button", { name: "말티푸" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "비글" })).toBeNull();
  // 검색 결과에는 종별 묶음이 없다
  expect(screen.queryByRole("heading", { name: "강아지" })).toBeNull();
});

test("띄어쓰기가 달라도 찾는다", () => {
  render(<BreedPicker query="토이푸들" onPick={() => {}} />);
  expect(screen.getByRole("button", { name: "토이 푸들" })).toBeDefined();
});

test("들어맞는 것이 없으면 그렇다고 알린다", () => {
  render(<BreedPicker query="없는품종" onPick={() => {}} />);
  expect(screen.getByText(/찾는 품종이 없어요/)).toBeDefined();
});

test("고른 품종을 aria-current로 알린다", () => {
  render(<BreedPicker query="" current="말티즈" currentSpecies="dog" onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "말티즈" }).getAttribute("aria-current")).toBe("true");
  expect(screen.getByRole("button", { name: "비글" }).getAttribute("aria-current")).toBeNull();
});

test("양쪽에 다 있는 이름은 고른 종의 줄만 현재로 표시한다", () => {
  render(<BreedPicker query="" current="기타" currentSpecies="cat" onPick={() => {}} />);

  const rows = screen.getAllByRole("button", { name: "기타" });
  expect(rows.map((row) => row.getAttribute("aria-current"))).toEqual([null, "true"]);
});

// "기타"가 강아지·고양이 양쪽에 있다. 개수만 세면 둘 다 한쪽에 있어도 통과하므로
// 묶음 안으로 좁혀서 본다
test("기타가 종별 묶음에 하나씩 있고 누르면 그 종을 넘긴다", () => {
  const onPick = vi.fn();
  render(<BreedPicker query="" onPick={onPick} />);

  const dog = within(screen.getByRole("region", { name: "강아지" }));
  const cat = within(screen.getByRole("region", { name: "고양이" }));

  fireEvent.click(dog.getByRole("button", { name: "기타" }));
  expect(onPick).toHaveBeenLastCalledWith("기타", "dog");

  fireEvent.click(cat.getByRole("button", { name: "기타" }));
  expect(onPick).toHaveBeenLastCalledWith("기타", "cat");
});

// 검색 결과에는 묶음이 없어 이름만으로는 어느 종의 "기타"인지 알 수 없다
test("검색 결과의 기타에는 종 이름이 붙는다", () => {
  const onPick = vi.fn();
  render(<BreedPicker query="기타" onPick={onPick} />);

  fireEvent.click(screen.getByRole("button", { name: /^기타\s*고양이$/ }));
  expect(onPick).toHaveBeenCalledWith("기타", "cat");
});
