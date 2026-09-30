// 비교 자리 하나 테스트. 빈 자리 안내, 채워진 자리의 적합도 우열·장바구니 담기를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { CompareSlot, type CompareProduct } from "./compare-slot";

const PRODUCT: CompareProduct = {
  id: "1",
  name: "연어 사료 1kg",
  price: 31500,
  kind: "food",
  matchScore: 89,
};

test("빈 자리는 상품 추가 버튼을 보여주고 누르면 onAdd가 불린다", () => {
  const onAdd = vi.fn();
  render(<CompareSlot onAdd={onAdd} />);

  fireEvent.click(screen.getByRole("button", { name: /상품 추가하기/ }));
  expect(onAdd).toHaveBeenCalled();
});

test("채워진 자리는 이름·가격·적합도를 보여준다", () => {
  render(<CompareSlot product={PRODUCT} />);

  expect(screen.getByText("연어 사료 1kg")).toBeDefined();
  expect(screen.getByText("31,500원")).toBeDefined();
  expect(screen.getByText("89점")).toBeDefined();
});

// 재지 못한 상품(#119)에는 0점을 채우지 않고 점수 자체를 그리지 않는다
test("적합도를 재지 못했으면 점수를 그리지 않는다", () => {
  render(<CompareSlot product={{ ...PRODUCT, matchScore: null }} />);

  expect(screen.queryByText(/점$/)).toBeNull();
});

test("장바구니 추가를 누르면 onAddToCart가 불린다", () => {
  const onAddToCart = vi.fn();
  render(<CompareSlot product={PRODUCT} onAddToCart={onAddToCart} />);

  fireEvent.click(screen.getByRole("button", { name: "장바구니 추가" }));
  expect(onAddToCart).toHaveBeenCalled();
});

// 품절 상품도 장바구니 추가가 눌려 시트가 열리고, 서버가 거절해야 알 수 있었다(#535)
test("품절이면 장바구니 추가를 막고 품절이라고 알린다", () => {
  const onAddToCart = vi.fn();
  render(<CompareSlot product={{ ...PRODUCT, soldOut: true }} onAddToCart={onAddToCart} />);

  const button = screen.getByRole("button", { name: "품절" });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.click(button);
  expect(onAddToCart).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "장바구니 추가" })).toBeNull();
});

test("빼기를 누르면 onRemove가 불린다", () => {
  const onRemove = vi.fn();
  render(<CompareSlot product={PRODUCT} onRemove={onRemove} />);

  fireEvent.click(screen.getByRole("button", { name: /비교에서 빼기/ }));
  expect(onRemove).toHaveBeenCalled();
});
