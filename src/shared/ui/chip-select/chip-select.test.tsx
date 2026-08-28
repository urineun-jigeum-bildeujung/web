// 단일선택 칩 단위 테스트. 라디오 시맨틱과 선택 전달을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ChipSelect } from "./chip-select";

const GENDER = [
  { value: "male", label: "남자아이" },
  { value: "female", label: "여자아이" },
];

const SIZE = [
  { value: "small", label: "소형견", description: "10kg 미만" },
  { value: "medium", label: "중형견", description: "10kg ~ 25kg" },
  { value: "large", label: "대형견", description: "25kg 이상" },
];

test("보기가 라디오로 렌더링된다", () => {
  render(<ChipSelect label="아이의 성별" options={GENDER} />);

  expect(screen.getByRole("radiogroup", { name: "아이의 성별" })).toBeDefined();
  expect(screen.getAllByRole("radio")).toHaveLength(2);
});

test("레이블을 눌러 고르면 값이 전달된다", () => {
  const onValueChange = vi.fn();
  render(<ChipSelect label="아이의 성별" options={GENDER} onValueChange={onValueChange} />);

  fireEvent.click(screen.getByText("남자아이"));
  expect(onValueChange).toHaveBeenCalledWith("male");
});

test("고른 값이 checked로 표시된다", () => {
  render(<ChipSelect label="아이의 성별" options={GENDER} value="female" />);

  expect(screen.getByRole("radio", { name: "여자아이" }).getAttribute("aria-checked")).toBe("true");
  expect(screen.getByRole("radio", { name: "남자아이" }).getAttribute("aria-checked")).toBe(
    "false",
  );
});

test("보충 설명을 함께 보여준다", () => {
  render(<ChipSelect label="아이의 체구" options={SIZE} />);
  expect(screen.getByText("10kg 미만")).toBeDefined();
});
