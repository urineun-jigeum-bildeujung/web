// 별점 표시 테스트. 값을 스크린 리더가 읽을 수 있는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Rating } from "./rating";

test("별 모양만으로 읽히지 않도록 점수를 문장으로 함께 둔다", () => {
  render(<Rating value={4} />);
  expect(screen.getByText("5점 만점에 4점")).toBeDefined();
});

test("showValue를 주면 숫자도 함께 보여준다", () => {
  render(<Rating value={3.5} showValue />);
  expect(screen.getByText("3.5")).toBeDefined();
});
