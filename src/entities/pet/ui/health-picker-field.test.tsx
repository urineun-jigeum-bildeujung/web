// 고르는 자리 테스트. 고른 것을 무엇으로 되보이는지와 잠겼을 때를 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { HealthGroup } from "../model/health";
import { HealthPickerField } from "./health-picker-field";

/** 알레르기는 저장 코드와 표시명이 다르다 */
const ALLERGIES: HealthGroup[] = [
  {
    label: "알레르기",
    items: [
      { value: "CHICKEN", label: "닭고기" },
      { value: "DAIRY", label: "유제품" },
    ],
  },
];

/** 건강 고민은 값과 표시가 같다 */
const CONCERNS: HealthGroup[] = [
  { label: "관절·뼈", items: [{ value: "슬개골 탈구", label: "슬개골 탈구" }] },
];

function renderField(props: Partial<Parameters<typeof HealthPickerField>[0]> = {}) {
  return render(
    <HealthPickerField
      title="피해야 할 성분"
      groups={ALLERGIES}
      value={[]}
      onChange={vi.fn()}
      {...props}
    />,
  );
}

// 저장은 코드로 하지만 사람에게 `CHICKEN`을 보이면 무엇을 골랐는지 알 수 없다
test("고른 코드를 표시명으로 되보인다", () => {
  renderField({ value: ["CHICKEN", "DAIRY"] });

  expect(screen.getByText("닭고기")).toBeDefined();
  expect(screen.getByText("유제품")).toBeDefined();
  expect(screen.queryByText("CHICKEN")).toBeNull();
});

test("값과 표시가 같은 건강 고민은 그대로 보인다", () => {
  renderField({ title: "걱정되는 질환", groups: CONCERNS, value: ["슬개골 탈구"] });

  expect(screen.getByText("슬개골 탈구")).toBeDefined();
});

// 목록을 아직 못 받았거나 서버에서 빠진 항목이다. 빈칸보다 값이라도 보이는 편이 낫다
test("목록에 없는 값은 값 그대로 보인다", () => {
  renderField({ groups: [], value: ["CHICKEN"] });

  expect(screen.getByText("CHICKEN")).toBeDefined();
});

test("잠기면 고른 것이 있어도 보이지 않는다", () => {
  renderField({ value: ["CHICKEN"], disabled: true });

  expect(screen.queryByText("닭고기")).toBeNull();
  expect(screen.getByRole("button", { name: "피해야 할 성분" }).hasAttribute("disabled")).toBe(
    true,
  );
});
