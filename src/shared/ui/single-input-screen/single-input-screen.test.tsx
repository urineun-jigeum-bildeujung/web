// 단일 입력 화면 골격 테스트. 질문·본문·완료 버튼 배치를 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SingleInputScreen } from "./single-input-screen";

test("질문을 heading으로 보여주고 본문을 담는다", () => {
  render(
    <SingleInputScreen question="어떤 이름으로 불러드릴까요?">
      <input aria-label="닉네임" />
    </SingleInputScreen>,
  );

  expect(screen.getByRole("heading", { name: "어떤 이름으로 불러드릴까요?" })).toBeDefined();
  expect(screen.getByLabelText("닉네임")).toBeDefined();
});

test("완료 버튼은 기본이 '입력 완료'이고 비활성 상태를 받는다", () => {
  const onSubmit = vi.fn();
  render(
    <SingleInputScreen question="질문" submitDisabled onSubmit={onSubmit}>
      <span />
    </SingleInputScreen>,
  );

  const submit = screen.getByRole("button", { name: "입력 완료" });
  fireEvent.click(submit);
  expect(onSubmit).not.toHaveBeenCalled();
});

test("설명을 함께 보여준다", () => {
  render(
    <SingleInputScreen question="질문" description="보충 설명">
      <span />
    </SingleInputScreen>,
  );

  expect(screen.getByText("보충 설명")).toBeDefined();
});
