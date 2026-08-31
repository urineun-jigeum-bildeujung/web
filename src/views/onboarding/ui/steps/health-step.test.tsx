// 건강 단계 테스트. 무엇을 답으로 셀지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { EMPTY_PROFILE_DRAFT } from "@/entities/pet";

import { HealthStep } from "./health-step";

function renderWith(patch: Partial<typeof EMPTY_PROFILE_DRAFT>) {
  render(
    <HealthStep
      draft={{ ...EMPTY_PROFILE_DRAFT, ...patch }}
      onChange={vi.fn()}
      onPrev={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
  return screen.getByRole("button", { name: "다음 단계 작성하기" }) as HTMLButtonElement;
}

test("공백만 적은 것은 답으로 세지 않는다", () => {
  expect(renderWith({ concern: "   ", allergy: "   " }).disabled).toBe(true);
});

test("두 항목에 답이 있어야 다음으로 넘어간다", () => {
  expect(renderWith({ concern: "눈물자국", allergy: "닭고기" }).disabled).toBe(false);
});

test("해당 없음을 고르는 것도 답이다", () => {
  expect(renderWith({ noConcern: true, noAllergy: true }).disabled).toBe(false);
});
