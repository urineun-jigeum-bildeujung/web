// 아이 건강 정보 수정 테스트. 무엇을 답으로 셀지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { EditPetHealthView } from "./edit-pet-health-view";

function submitButton() {
  return screen.getByRole("button", { name: "수정 완료" }) as HTMLButtonElement;
}

test("저장된 값이 채워진 채로 열린다", () => {
  render(<EditPetHealthView />);

  expect((screen.getByLabelText("평소 신경 쓰이는 곳") as HTMLInputElement).value).toBe("눈물자국");
  expect(submitButton().disabled).toBe(false);
});

test("두 항목 모두 답이 있어야 고칠 수 있다", () => {
  render(<EditPetHealthView />);

  // 신경 쓰이는 곳을 지우고 해당 없음도 끄면 답이 없다
  fireEvent.change(screen.getByLabelText("평소 신경 쓰이는 곳"), { target: { value: "   " } });
  expect(submitButton().disabled).toBe(true);
});

test("해당 없음을 켜면 그 입력을 잠근다", () => {
  render(<EditPetHealthView />);

  const input = screen.getByLabelText("평소 신경 쓰이는 곳") as HTMLInputElement;
  expect(input.disabled).toBe(false);

  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  expect(input.disabled).toBe(true);
});

test("해당 없음을 끄면 그 항목을 다시 받는다", () => {
  render(<EditPetHealthView />);

  // 해당 없음이 켜진 채로 값을 남겨 두면, 체크를 껐을 때 그 문구가
  // 성분처럼 남고 답한 것으로 세진다.
  const [, allergyCheck] = screen.getAllByRole("checkbox");
  fireEvent.click(allergyCheck);

  expect((screen.getByLabelText("피해야 할 알러지 성분") as HTMLInputElement).value).toBe("");
  expect(submitButton().disabled).toBe(true);
});
