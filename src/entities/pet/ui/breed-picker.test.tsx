// 품종 목록 테스트. 검색 전 종별 묶음, 검색어로 거르기, 줄을 누르면 고른 품종을 넘기는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { SpeciesBreed } from "../api/breeds";
import { BreedPicker } from "./breed-picker";

/** 서버가 주는 모양 그대로. 같은 이름("기타")이 양쪽에 있고 id는 다르다 */
const BREEDS: SpeciesBreed[] = [
  { id: 1, breedName: "말티즈", species: "dog" },
  { id: 2, breedName: "토이 푸들", species: "dog" },
  { id: 35, breedName: "기타", species: "dog" },
  { id: 36, breedName: "코리안 숏헤어", species: "cat" },
  { id: 58, breedName: "기타", species: "cat" },
];

test("검색어가 없으면 강아지와 고양이를 따로 묶어 전부 보여준다", () => {
  render(<BreedPicker breeds={BREEDS} query="" onPick={() => {}} />);

  expect(screen.getByRole("heading", { name: "강아지" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "고양이" })).toBeDefined();
  expect(screen.getByRole("button", { name: "말티즈" })).toBeDefined();
  expect(screen.getByRole("button", { name: "코리안 숏헤어" })).toBeDefined();
});

test("줄을 누르면 고른 품종을 통째로 넘긴다", () => {
  const onPick = vi.fn();
  render(<BreedPicker breeds={BREEDS} query="" onPick={onPick} />);

  fireEvent.click(screen.getByRole("button", { name: "코리안 숏헤어" }));

  expect(onPick).toHaveBeenCalledWith({ id: 36, breedName: "코리안 숏헤어", species: "cat" });
});

// 등록 API가 breedId를 받으므로 이름이 같아도 id로 갈려야 한다
test("같은 이름이라도 종에 따라 다른 id를 넘긴다", () => {
  const onPick = vi.fn();
  render(<BreedPicker breeds={BREEDS} query="" onPick={onPick} />);

  const catList = screen.getByRole("heading", { name: "고양이" }).parentElement!;
  fireEvent.click(within(catList).getByRole("button", { name: "기타" }));

  expect(onPick).toHaveBeenCalledWith({ id: 58, breedName: "기타", species: "cat" });
});

test("검색어를 넣으면 걸러진 것만 한 줄로 보여준다", () => {
  render(<BreedPicker breeds={BREEDS} query="말티" onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "말티즈" })).toBeDefined();
  expect(screen.queryByRole("heading", { name: "강아지" })).toBeNull();
  expect(screen.queryByRole("button", { name: "코리안 숏헤어" })).toBeNull();
});

// "말티 즈"로 쳐도 찾아야 한다
test("띄어쓰기를 무시하고 견준다", () => {
  render(<BreedPicker breeds={BREEDS} query="토이푸들" onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "토이 푸들" })).toBeDefined();
});

// 검색 결과는 종 묶음이 없어 "기타"가 둘 나란히 보인다. 무엇이 무엇인지 알 수 없으면 못 고른다
test("검색 결과에서 양쪽에 다 있는 이름은 종을 덧붙인다", () => {
  render(<BreedPicker breeds={BREEDS} query="기타" onPick={() => {}} />);

  const names = screen.getAllByRole("button").map((row) => row.textContent);
  expect(names).toEqual(["기타강아지", "기타고양이"]);
});

// 한쪽에만 있는 이름에까지 종을 붙이면 목록이 시끄러워진다
test("한쪽에만 있는 이름에는 종을 붙이지 않는다", () => {
  render(<BreedPicker breeds={BREEDS} query="말티" onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "말티즈" }).textContent).toBe("말티즈");
});

test("고른 품종은 id로 표시한다", () => {
  render(<BreedPicker breeds={BREEDS} query="" currentId={2} onPick={() => {}} />);

  expect(screen.getByRole("button", { name: "토이 푸들" }).getAttribute("aria-current")).toBe(
    "true",
  );
  expect(screen.getByRole("button", { name: "말티즈" }).hasAttribute("aria-current")).toBe(false);
});

test("찾는 품종이 없으면 기타를 고르라고 알린다", () => {
  render(<BreedPicker breeds={BREEDS} query="없는품종" onPick={() => {}} />);

  expect(screen.getByText(/찾는 품종이 없어요/)).toBeDefined();
});
