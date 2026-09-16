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

test("반 개는 채운 별을 절반만 보인다", () => {
  const { container } = render(<Rating value={4.5} />);

  // 노란 별은 5개(넷은 온전히, 하나는 절반)이고 절반짜리만 w-1/2로 잘린다
  const filled = container.querySelectorAll(".text-icon-fill-accent");
  expect(filled).toHaveLength(5);
  expect(container.querySelectorAll(".w-1\\/2")).toHaveLength(1);
});
