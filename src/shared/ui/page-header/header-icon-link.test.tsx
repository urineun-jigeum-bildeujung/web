// 머리말 오른쪽 아이콘 슬롯 테스트. 시안 슬롯 크기와 이름·뱃지 자리를 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { HeaderIconLink } from "./header-icon-link";

// 시안 공용 header의 슬롯은 33×32에 28px 아이콘이다. 화면마다 44px 버튼·다른 넓힘을 쓰던 것을 맞춘다(#513)
test("시안 슬롯 크기(33×32)에 28px 아이콘을 두고 이름으로 읽힌다", () => {
  render(<HeaderIconLink href="/search" label="검색" icon="search" />);

  const link = screen.getByRole("link", { name: "검색" });
  expect(link.getAttribute("href")).toBe("/search");
  expect(link.className).toContain("h-8");
  expect(link.className).toContain("w-8.25");
  expect(link.querySelector("svg")?.getAttribute("class")).toContain("size-7");
});

test("뱃지는 아이콘 모서리 자리 안에 붙는다", () => {
  render(<HeaderIconLink href="/cart" label="장바구니에 3개" icon="cart" badge={<span>3</span>} />);

  const badge = screen.getByText("3");
  expect(badge.parentElement?.className).toContain("size-7");
});
