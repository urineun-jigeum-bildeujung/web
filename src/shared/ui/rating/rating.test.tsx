// 별점 테스트. 눈으로 보이는 별과 스크린 리더가 읽는 문구가 같은 값을 가리키는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Rating } from "./rating";

test("기본 5점 만점으로 읽는다", () => {
  render(<Rating value={4} />);
  expect(screen.getByText("5점 만점에 4점")).toBeDefined();
});

test("만점을 바꾸면 문구도 따라간다", () => {
  render(<Rating value={3} max={10} />);

  // 별은 max개를 그리면서 문구만 5점 만점으로 읽던 문제
  expect(screen.getByText("10점 만점에 3점")).toBeDefined();
});
