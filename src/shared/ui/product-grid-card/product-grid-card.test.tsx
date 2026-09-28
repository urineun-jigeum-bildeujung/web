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

// 부모가 items-start 세로 flex라 폭을 묶지 않으면 truncate가 걸리지 않고 옆 카드까지 넘친다.
// 홈 타임딜 줄에서 160px 카드의 이름이 176px로 그려졌다 (#479)
test("말줄임할 이름·옵션 줄은 폭을 카드에 묶는다", () => {
  render(<ProductGridCard name="연어&감자 그레인프리 사료 2kg" option="2kg" price={21800} />);

  expect(screen.getByText("연어&감자 그레인프리 사료 2kg").className).toContain("max-w-full");
  expect(screen.getByText("2kg").className).toContain("max-w-full");
});
