// 대기 표시 단위 테스트. 자리를 지키는지와 보조기기에 무엇이 읽히는지를 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { LoadingSwap } from "./loading-swap";

test("대기 중이 아니면 내용만 보이고 상태 표시가 없다", () => {
  render(<LoadingSwap loading={false}>결제하기</LoadingSwap>);

  expect(screen.getByText("결제하기")).toBeDefined();
  expect(screen.queryByRole("status")).toBeNull();
});

test("대기 중에는 스피너를 한국어로 알린다", () => {
  render(<LoadingSwap loading>결제하기</LoadingSwap>);

  expect(screen.getByRole("status", { name: "처리 중" })).toBeDefined();
});

test("조회를 기다리는 자리는 문구를 바꿔 넣을 수 있다", () => {
  render(
    <LoadingSwap loading label="다음 쪽을 불러오는 중">
      <span>다음</span>
    </LoadingSwap>,
  );

  expect(screen.getByRole("status", { name: "다음 쪽을 불러오는 중" })).toBeDefined();
});

// 내용을 걷어내면 버튼이 줄었다 늘어난다. DOM에 남긴 채 `invisible`로 가리는 것이 이 컴포넌트의 핵심이라
// 클래스까지 확인한다. jsdom은 Tailwind 스타일시트를 읽지 않아 실제 가려짐은 여기서 검증할 수 없다.
test("대기 중에도 원래 내용이 자리를 지킨다", () => {
  render(<LoadingSwap loading>결제하기</LoadingSwap>);

  const content = screen.getByText("결제하기");
  expect(content).toBeDefined();
  expect(content.className).toContain("invisible");
});

// 자식보다 스피너가 클 때 자리가 벌어지지 않아야 한다. 격자에 겹쳐 두면 칸이 더 큰 쪽을
// 따라가서 `size-3` 자식이 대기하는 동안 12px에서 16px로 늘어났다 (#233 리뷰).
// 스피너를 흐름에서 빼는 것이 그것을 막는 장치라 클래스로 확인한다 — jsdom은 레이아웃을
// 계산하지 않아 실제 크기는 브라우저에서 쟀다.
test("스피너가 자리 크기를 정하지 않는다", () => {
  render(
    <LoadingSwap loading>
      <svg className="size-3" />
    </LoadingSwap>,
  );

  expect(screen.getByRole("status").getAttribute("class")).toContain("absolute");
});

test("자리에 맞춰 스피너 크기를 키울 수 있다", () => {
  render(
    <LoadingSwap loading spinnerClassName="size-5">
      <span>다음</span>
    </LoadingSwap>,
  );

  expect(screen.getByRole("status").getAttribute("class")).toContain("size-5");
});
