// 단계 표시 단위 테스트. 진행률이 접근성 속성으로 읽히는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { StepProgress } from "./step-progress";

test("전체와 현재 단계를 progressbar로 알린다", () => {
  render(<StepProgress total={4} current={2} />);

  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("2");
  expect(bar.getAttribute("aria-valuemax")).toBe("4");
  expect(bar.getAttribute("aria-label")).toBe("전체 4단계 중 2단계");
});

test("칸을 전체 단계 수만큼 그린다", () => {
  const { container } = render(<StepProgress total={4} current={1} />);
  expect(container.querySelectorAll("span")).toHaveLength(4);
});
