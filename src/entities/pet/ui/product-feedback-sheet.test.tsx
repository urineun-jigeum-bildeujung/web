// 답변과 보류가 무엇으로 나가는지, 보내는 동안 막히는지, 실패하면 완료로 안 가는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ProductFeedbackSheet } from "./product-feedback-sheet";

const TARGET = { productId: "7", productName: "오메가3 피쉬오일 60캡슐" };

function renderSheet(overrides: Partial<Parameters<typeof ProductFeedbackSheet>[0]> = {}) {
  const props = {
    target: TARGET,
    petName: "코코",
    onOpenChange: vi.fn(),
    ...overrides,
  };
  render(<ProductFeedbackSheet {...props} />);
  return props;
}

it("답을 고르고 등록하면 그 값으로 보내고 완료를 보인다", async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderSheet({ onSubmit });

  fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
  fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

  expect(onSubmit).toHaveBeenCalledWith({ answer: "GOOD" });
  expect(await screen.findByText("반응이 등록됐어요")).toBeDefined();
  expect(screen.getByText("코코의 다음 추천 적합도에 반영할게요")).toBeDefined();
});

// 아직 답할 수 없다는 것도 답이다. 체크하면 고른 답을 비우므로 보류만 나간다
it("아직 이르다고 체크하면 보류로 보낸다", () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderSheet({ onSubmit });

  fireEvent.click(screen.getByRole("radio", { name: "안 맞았어요" }));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

  expect(onSubmit).toHaveBeenCalledWith({ postpone: true });
});

it("보내다 실패하면 완료로 가지 않고 그 자리에 남는다", async () => {
  const onSubmit = vi.fn().mockRejectedValue(new Error("409"));
  renderSheet({ onSubmit });

  fireEvent.click(screen.getByRole("radio", { name: "그냥 그랬어요" }));
  fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(screen.queryByText("반응이 등록됐어요")).toBeNull();
  expect(screen.getByRole("radio", { name: "그냥 그랬어요" })).toBeDefined();
});

it("보내는 동안 등록이 막힌다", () => {
  renderSheet({ onSubmit: vi.fn(), isSubmitting: true });

  fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
  expect(screen.getByRole("button", { name: /등록하기|처리 중/ }).hasAttribute("disabled")).toBe(
    true,
  );
});

// 메인의 상태 체크는 아직 목데이터라 서버에 보내지 않는다
it("onSubmit이 없으면 화면만 완료로 바꾼다", async () => {
  renderSheet({ variant: "full" });

  fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
  fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

  expect(await screen.findByText("반응이 등록됐어요")).toBeDefined();
});
