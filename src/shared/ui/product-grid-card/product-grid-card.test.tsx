// 고르는 모드(selectable)의 카드가 그리드 칸 너비를 채우는지 본다.
// button은 div와 달리 width:auto가 내용에 맞춰 줄어들어(폼 컨트롤의 내재적 크기 규칙),
// w-full이 빠지면 같은 그리드 안에서도 카드마다 이미지 크기가 들쭉날쭉해진다.
import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";

import { ProductGridCard } from "./product-grid-card";

test("고르는 모드 카드는 폭이 줄어들지 않도록 w-full을 갖는다", () => {
  render(<ProductGridCard name="연어 사료 1kg" price={31500} selectable />);

  expect(screen.getByRole("button").className).toContain("w-full");
});
