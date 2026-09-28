// 담은 것이 있을 때만 뱃지가 붙는지, 링크 이름에 가짓수가 실리는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const cart = { count: 0 };
vi.mock("@/entities/cart", () => ({
  useQueryCartCount: () => cart.count,
}));

import { CartLink } from "./cart-link";

test("담은 것이 없으면 뱃지 없이 장바구니로 가는 링크다", () => {
  cart.count = 0;
  render(<CartLink />);

  expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  expect(screen.queryByText("0")).toBeNull();
});

// 전에는 담은 것과 상관없이 늘 "5"였다
test("담은 가짓수를 뱃지와 링크 이름에 싣는다", () => {
  cart.count = 3;
  render(<CartLink />);

  expect(screen.getByRole("link", { name: "장바구니에 3개" })).toBeDefined();
  expect(screen.getByText("3")).toBeDefined();
});

test("백 가지부터는 뱃지를 99+로 줄이고 이름에는 그대로 싣는다", () => {
  cart.count = 120;
  render(<CartLink />);

  expect(screen.getByRole("link", { name: "장바구니에 120개" })).toBeDefined();
  expect(screen.getByText("99+")).toBeDefined();
});
