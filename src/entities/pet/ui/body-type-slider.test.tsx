// 손잡이 값이 숫자가 아니라 체형 이름으로 읽히는지 본다. 눈금 문구는 aria-hidden이라 이것뿐이다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { BodyTypeSlider } from "./body-type-slider";

test("손잡이 값이 체형 이름으로 읽힌다", () => {
  render(<BodyTypeSlider value={2} onValueChange={vi.fn()} />);

  const thumb = screen.getByRole("slider", { name: "체형" });
  expect(thumb.getAttribute("aria-valuenow")).toBe("2");
  expect(thumb.getAttribute("aria-valuetext")).toBe("보통");
});
