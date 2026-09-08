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
  // 시안이 적정을 초록, 과다를 빨강으로만 구분한다. 색을 구분하기 어려우면 아무 정보가 아니다
  it("구간을 글자로도 알린다", () => {
    render(
      <NutrientBar
        nutrient={{ name: "지방", valueLabel: "12%", position: 0.86, properRange: proper }}
      />,
    );

    expect(screen.getByText("지방 과다", { exact: false })).toBeDefined();
  });

  it("기준이 없으면 눈금 대신 이유를 적는다", () => {
    render(<NutrientBar nutrient={{ name: "오메가3", valueLabel: "3%", position: 0.5 }} />);

    expect(screen.queryByText("적정")).toBeNull();
    expect(screen.getByText("절대 기준치가 없어 상대적으로만 표기해요")).toBeDefined();
  });
});
