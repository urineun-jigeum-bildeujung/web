// 하단 고정 버튼 줄 단위 테스트. 버튼 배치와 비활성 전달을 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { BottomActionBar } from "./bottom-action-bar";

test("버튼 하나를 그대로 보여준다", () => {
  render(
    <BottomActionBar>
      <button type="button">입력 완료</button>
    </BottomActionBar>,
  );

  expect(screen.getByRole("button", { name: "입력 완료" })).toBeDefined();
});

test("버튼 둘을 순서대로 보여주고 비활성 상태를 유지한다", () => {
  render(
    <BottomActionBar>
      <button type="button">이전</button>
      <button type="button" disabled>
        다음 단계 작성하기
      </button>
    </BottomActionBar>,
  );

  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(2);
  expect(buttons[0].textContent).toBe("이전");
  expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
});
