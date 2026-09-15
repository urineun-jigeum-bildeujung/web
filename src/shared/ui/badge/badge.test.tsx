// 배지 단위 테스트. 글자를 보이고 뜻에 따라 색이 갈리는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Badge } from "./badge";

test("글자를 그대로 보인다", () => {
  render(<Badge>구매 후 6일</Badge>);
  expect(screen.getByText("구매 후 6일")).toBeDefined();
});

test("tone에 따라 배경이 갈린다", () => {
  const { rerender } = render(<Badge>기본</Badge>);
  expect(screen.getByText("기본").className).toContain("bg-surface-secondary");

  rerender(<Badge tone="positive">3번째 구매</Badge>);
  expect(screen.getByText("3번째 구매").className).toContain("bg-surface-positive-weak");

  rerender(<Badge tone="danger">복숭아</Badge>);
  expect(screen.getByText("복숭아").className).toContain("bg-surface-danger-weak");
});
