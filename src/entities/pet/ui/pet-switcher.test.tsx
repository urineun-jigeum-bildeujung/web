// 단일 선택은 라디오, 다중 선택은 체크박스로 읽히고 누른 아이를 알리는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { PetSwitcher } from "./pet-switcher";

const PETS = [
  { id: "1", name: "소리" },
  { id: "2", name: "냥냥이" },
];

test("selectedId를 주면 라디오로 하나만 고른다", () => {
  const onSelect = vi.fn();
  render(<PetSwitcher pets={PETS} selectedId="1" onSelect={onSelect} />);

  expect(screen.getByRole("radiogroup", { name: "아이 고르기" })).toBeDefined();
  expect(screen.getByRole("radio", { name: "소리" }).getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("radio", { name: "냥냥이" }));
  expect(onSelect).toHaveBeenCalledWith("2");
});

// 한 상품을 두 아이에게 함께 먹이는 리뷰 작성에서 쓴다
test("selectedIds를 주면 체크박스로 여러 마리를 고른다", () => {
  const onToggle = vi.fn();
  render(<PetSwitcher pets={PETS} selectedIds={["1", "2"]} onToggle={onToggle} />);

  expect(screen.getByRole("group", { name: "아이 고르기" })).toBeDefined();
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  expect(screen.getByRole("checkbox", { name: "냥냥이" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "소리" }));
  expect(onToggle).toHaveBeenCalledWith("1");
});
