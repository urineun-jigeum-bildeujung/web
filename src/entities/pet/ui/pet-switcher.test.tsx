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

// 360px 폭에서 60px 원 다섯 칸이면 넘치는데, 줄이 아니라 페이지 전체가 옆으로 밀렸다(QA HM-016).
// jsdom은 레이아웃을 계산하지 않아 여기서는 줄이 스크롤을 맡고 칸이 줄지 않는지만 본다.
// 실제 넘침은 e2e/home.spec.ts가 360px 브라우저에서 잰다
test("메인 모양은 넘치면 줄만 옆으로 밀리고 칸은 줄어들지 않는다", () => {
  render(
    <PetSwitcher pets={PETS} selectedId="1" onSelect={vi.fn()} onAdd={vi.fn()} variant="main" />,
  );

  expect(screen.getByRole("radiogroup", { name: "아이 고르기" }).className).toContain(
    "overflow-x-auto",
  );
  for (const item of [
    ...screen.getAllByRole("radio"),
    screen.getByRole("button", { name: "새 아이 추가" }),
  ]) {
    expect(item.className).toContain("shrink-0");
  }
});

// 회색 원만 있으면 어느 아이인지 알 수 없다(QA 1차 4번, #470)
test("사진이 없는 아이는 원 안에 이름 앞 두 글자를 넣는다", () => {
  render(<PetSwitcher pets={PETS} selectedId="1" onSelect={vi.fn()} />);

  expect(screen.getByRole("radio", { name: "냥냥이" }).textContent).toBe("냥냥");
});
