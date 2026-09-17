// 건강 단계 테스트. 무엇을 답으로 셀지와 고른 것이 어떻게 보이는지 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { EMPTY_PROFILE_DRAFT } from "@/entities/pet";

// 선택지 조회는 가짜로 둔다. 무엇을 보내고 어떻게 옮기는지는 `entities/pet/api/health-options.test.ts`가 본다
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryHealthOptions: () => ({
    options: {
      concerns: [
        {
          label: "관절·뼈",
          items: [
            { value: "슬개골 탈구", label: "슬개골 탈구" },
            { value: "관절염", label: "관절염" },
          ],
        },
        { label: "체중·대사", items: [{ value: "과체중·비만", label: "과체중·비만" }] },
      ],
      allergies: [
        {
          label: "알레르기",
          items: [
            { value: "CHICKEN", label: "닭고기" },
            { value: "DAIRY", label: "유제품" },
          ],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

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
    next: screen.getByRole("button", { name: "작성 완료" }) as HTMLButtonElement,
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

  test("해당 없음을 켜면 고를 수 없고 고른 것도 보이지 않는다", () => {
    renderWith({ noConcern: true, concern: ["슬개골 탈구"] });

    const picker = screen.getByRole("button", { name: "걱정되는 질환" }) as HTMLButtonElement;
    expect(picker.disabled).toBe(true);
    // 답이 아니라고 표시한 상태라 배지를 비운다
    expect(screen.queryByText("슬개골 탈구")).toBeNull();
  });

  test("해당 없음을 켜면 고른 것이 비워진다", () => {
    const { onChange } = renderWith({ concern: ["슬개골 탈구"] });

    fireEvent.click(screen.getAllByLabelText("해당 사항이 없어요")[0]);

    expect(onChange).toHaveBeenCalledWith({ noConcern: true, concern: [] });
  });

  test("누르면 그 갈래의 시트가 열린다", () => {
    renderWith({});

    fireEvent.click(screen.getByRole("button", { name: "피해야 할 성분" }));

    // 알러지 쪽 시트라 성분이 뜨고 질환 갈래는 없다
    expect(screen.getByRole("button", { name: "닭고기" })).toBeDefined();
    expect(screen.queryByRole("tab", { name: "관절·뼈" })).toBeNull();
  });

  // 서버가 알레르기를 묶음 없이 줘서 탭이 하나뿐이다. 고를 것이 없는 탭 줄은 자리만 차지한다
  test("알러지 시트에는 탭 줄이 보이지 않는다", () => {
    renderWith({});

    fireEvent.click(screen.getByRole("button", { name: "피해야 할 성분" }));

    expect(screen.queryByRole("tab")).toBeNull();
  });
});
