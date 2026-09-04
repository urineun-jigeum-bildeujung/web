// 건강 단계 테스트. 무엇을 답으로 셀지와 고른 것이 어떻게 보이는지 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { EMPTY_PROFILE_DRAFT } from "@/entities/pet";

import { HealthStep } from "./health-step";

function renderWith(patch: Partial<typeof EMPTY_PROFILE_DRAFT>, onChange = vi.fn()) {
  render(
    <HealthStep
      draft={{ ...EMPTY_PROFILE_DRAFT, ...patch }}
      onChange={onChange}
      onPrev={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
  return {
    next: screen.getByRole("button", { name: "다음 단계 작성하기" }) as HTMLButtonElement,
    onChange,
  };
}

describe("넘어갈 수 있는 조건", () => {
  test("아무것도 고르지 않으면 넘어갈 수 없다", () => {
    expect(renderWith({}).next.disabled).toBe(true);
  });

  test("두 항목을 다 골라야 넘어간다", () => {
    expect(renderWith({ concern: ["슬개골 탈구"], allergy: ["닭고기"] }).next.disabled).toBe(false);
  });

  test("한 항목만 고르면 넘어갈 수 없다", () => {
    expect(renderWith({ concern: ["슬개골 탈구"] }).next.disabled).toBe(true);
  });

  test("해당 없음을 고르는 것도 답이다", () => {
    expect(renderWith({ noConcern: true, noAllergy: true }).next.disabled).toBe(false);
  });
});

describe("고르는 자리", () => {
  test("고른 것이 칩으로 보인다", () => {
    renderWith({ concern: ["슬개골 탈구", "관절염"] });

    expect(screen.getByText("슬개골 탈구")).toBeDefined();
    expect(screen.getByText("관절염")).toBeDefined();
  });

  test("해당 없음을 켜면 고를 수 없다", () => {
    renderWith({ noConcern: true });

    const picker = screen.getByRole("button", { name: "걱정되는 질환" }) as HTMLButtonElement;
    expect(picker.disabled).toBe(true);
  });

  test("해당 없음을 켜면 고른 것이 비워진다", () => {
    const { onChange } = renderWith({ concern: ["슬개골 탈구"] });

    fireEvent.click(screen.getAllByLabelText("해당 사항이 없어요")[0]);

    expect(onChange).toHaveBeenCalledWith({ noConcern: true, concern: [] });
  });

  test("누르면 그 갈래의 시트가 열린다", () => {
    renderWith({});

    fireEvent.click(screen.getByRole("button", { name: "피해야 할 성분" }));

    // 알러지 쪽 시트라 성분 계열 탭이 뜬다
    expect(screen.getByRole("tab", { name: "육류" })).toBeDefined();
    expect(screen.queryByRole("tab", { name: "관절" })).toBeNull();
  });
});
