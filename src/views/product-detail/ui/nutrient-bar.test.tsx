// 구간 판정이 경계에서 어느 쪽으로 갈리는지, 색 말고 글자로도 알리는지 본다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NutrientBar, getNutrientLevel } from "./nutrient-bar";

const proper: [number, number] = [0.3, 0.6];

describe("getNutrientLevel", () => {
  it.each([
    [0.1, "low"],
    [0.29, "low"],
    [0.3, "proper"],
    [0.45, "proper"],
    [0.6, "proper"],
    [0.61, "high"],
    [0.9, "high"],
  ])("자리가 %s면 %s다", (position, level) => {
    expect(
      getNutrientLevel({ name: "지방", valueLabel: "12%", position, properRange: proper }),
    ).toBe(level);
  });

  // 절대 기준치가 없는 성분은 재지 않는다. 가운데를 적정으로 읽으면 없는 판정을 만든다
  it("적정 구간이 없으면 재지 않은 것이다", () => {
    expect(getNutrientLevel({ name: "오메가3", valueLabel: "3%", position: 0.5 })).toBe("unknown");
  });
});

describe("NutrientBar", () => {
  // 시안의 배지는 값만 적는다("12%"). 부족/적정/과다는 막대 아래 줄이 굵기·색으로 맡는다
  it("배지는 값만 적고, 막대 아래 줄이 지금 구간을 굵게 표시한다", () => {
    render(
      <NutrientBar
        nutrient={{ name: "지방", valueLabel: "12%", position: 0.86, properRange: proper }}
      />,
    );

    expect(screen.getByText("12%")).toBeDefined();
    expect(screen.queryByText("12% 과다")).toBeNull();

    const active = screen.getByText("과다");
    expect(active.className).toContain("text-text-body-default");
    expect(active.className).toContain("text-label-bold-14");
    const inactive = screen.getByText("부족");
    expect(inactive.className).toContain("text-text-body-tertiary");
    expect(inactive.className).toContain("text-label-medium-14");
  });

  // 부족/적정/과다 줄은 aria-hidden이라 화면 낭독기가 건너뛴다. 구간은 값 배지의
  // 접근성 이름으로 전해야 화면 낭독기 사용자도 부족/적정/과다를 들을 수 있다
  it("화면 낭독기는 값 배지에서 구간까지 함께 듣는다", () => {
    render(
      <NutrientBar
        nutrient={{ name: "지방", valueLabel: "12%", position: 0.86, properRange: proper }}
      />,
    );

    expect(screen.getByLabelText("12%, 과다")).toBeDefined();
  });

  // 재지 않은 성분에 구간 이름을 붙이면 없는 판정을 만든다
  it("기준이 없으면 값만 적고 눈금 대신 이유를 적는다", () => {
    render(<NutrientBar nutrient={{ name: "오메가3", valueLabel: "3%", position: 0.5 }} />);

    expect(screen.getByText("3%").getAttribute("aria-label")).toBeNull();
    expect(screen.queryByText("적정")).toBeNull();
    expect(screen.queryByText("기준 없음")).toBeNull();
    expect(screen.getByText("절대적 기준치가 없어 정상적으로 표기돼요")).toBeDefined();
  });
});
