// 아이 건강 정보 수정 테스트. 무엇을 답으로 셀지와 고른 것이 어떻게 보이는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { EditPetHealthView } from "./edit-pet-health-view";

function submitButton() {
  return screen.getByRole("button", { name: "수정 완료" }) as HTMLButtonElement;
}

function picker(name: string) {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

test("저장된 값이 칩으로 채워진 채로 열린다", () => {
  render(<EditPetHealthView />);

  // 자유 입력이 아니라 고른 것을 되보인다
  expect(picker("걱정되는 질환").textContent).toContain("슬개골 탈구");
  expect(submitButton().disabled).toBe(false);
});

test("두 항목 모두 답이 있어야 고칠 수 있다", () => {
  render(<EditPetHealthView />);

  // 신경 쓰이는 곳의 해당 없음을 켰다 끄면 값이 비어 답이 없어진다
  const [concernCheck] = screen.getAllByRole("checkbox");
  fireEvent.click(concernCheck);
  fireEvent.click(concernCheck);

  expect(submitButton().disabled).toBe(true);
});

test("해당 없음을 켜면 고를 수 없고 문구가 바뀐다", () => {
  render(<EditPetHealthView />);

  const [concernCheck] = screen.getAllByRole("checkbox");
  fireEvent.click(concernCheck);

  const field = picker("걱정되는 질환");
  expect(field.disabled).toBe(true);
  // 시안 mypa_321이 잠긴 자리를 "해당 사항 없음"으로 바꾼다
  expect(field.textContent).toContain("해당 사항 없음");
});

test("해당 없음을 끄면 그 항목을 다시 받는다", () => {
  render(<EditPetHealthView />);

  // 켜진 채로 값을 남겨 두면 체크를 껐을 때 그것이 답으로 되살아난다
  const [, allergyCheck] = screen.getAllByRole("checkbox");
  fireEvent.click(allergyCheck);

  const field = picker("피해야 할 성분");
  expect(field.disabled).toBe(false);
  expect(field.textContent).toContain("피해야 할 성분을 골라주세요");
  expect(submitButton().disabled).toBe(true);
});

test("누르면 그 갈래의 시트가 열린다", () => {
  render(<EditPetHealthView />);

  fireEvent.click(picker("걱정되는 질환"));

  // 질환 쪽 시트라 관절 계열 탭이 뜬다
  expect(screen.getByRole("tab", { name: "관절" })).toBeDefined();
  expect(screen.queryByRole("tab", { name: "육류" })).toBeNull();
});
