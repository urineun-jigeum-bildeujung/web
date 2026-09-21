// 품종·건강 관심사 전체화면. 갈래를 바꾸면 오른쪽이 바뀌는지, 여러 개 고르고
// 적용·초기화가 되는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewFilterPicker, type PickerGroup } from "./review-filter-picker";

const GROUPS: PickerGroup[] = [
  {
    label: "소형견",
    items: [
      { value: "1", label: "말티즈" },
      { value: "2", label: "포메라니안" },
    ],
  },
  {
    label: "중형견",
    items: [{ value: "3", label: "웰시코기" }],
  },
];

function setup(overrides: Partial<React.ComponentProps<typeof ReviewFilterPicker>> = {}) {
  const onOpenChange = vi.fn();
  const onSpeciesChange = vi.fn();
  const onApply = vi.fn();

  render(
    <ReviewFilterPicker
      open
      onOpenChange={onOpenChange}
      title="품종 선택"
      itemNoun="품종"
      species="dog"
      onSpeciesChange={onSpeciesChange}
      groups={GROUPS}
      value={[]}
      onApply={onApply}
      {...overrides}
    />,
  );

  return { onOpenChange, onSpeciesChange, onApply };
}

describe("ReviewFilterPicker", () => {
  it("첫 갈래의 항목을 보여주고, 갈래를 바꾸면 오른쪽 목록이 바뀐다", () => {
    setup();

    expect(screen.getByText("말티즈")).toBeDefined();
    expect(screen.queryByText("웰시코기")).toBeNull();

    fireEvent.click(screen.getByText("중형견"));

    expect(screen.queryByText("말티즈")).toBeNull();
    expect(screen.getByText("웰시코기")).toBeDefined();
  });

  it("여러 개를 고르면 개수와 칩에 반영되고, 적용을 누르면 고른 값 그대로 전달된다", () => {
    const { onApply } = setup();

    fireEvent.click(screen.getByText("말티즈"));
    fireEvent.click(screen.getByText("포메라니안"));

    expect(screen.getByText("선택한 품종 2")).toBeDefined();
    expect(screen.getByRole("button", { name: "말티즈 빼기" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "적용하기" }));

    expect(onApply).toHaveBeenCalledWith(["1", "2"]);
  });

  it("초기화를 누르면 고른 것이 비워진다", () => {
    setup({ value: ["1"] });

    expect(screen.getByText("선택한 품종 1")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "초기화" }));

    expect(screen.getByText("선택한 품종 0")).toBeDefined();
  });

  it("종을 바꾸면 onSpeciesChange가 불린다", () => {
    const { onSpeciesChange } = setup();

    fireEvent.click(screen.getByRole("button", { name: "고양이" }));

    expect(onSpeciesChange).toHaveBeenCalledWith("cat");
  });

  it("닫기를 누르면 열림 상태가 꺼진다", () => {
    const { onOpenChange } = setup();

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("조회가 실패하면 빈 그룹 대신 실패 안내를 보여준다(코드래빗 리뷰)", () => {
    setup({ error: new Error("network down") });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("요청 실패")).toBeDefined();
    expect(screen.queryByText("말티즈")).toBeNull();
    expect(screen.queryByText("소형견")).toBeNull();
  });
});
