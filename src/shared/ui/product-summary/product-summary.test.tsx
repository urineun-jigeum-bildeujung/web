// 상품 요약 단위 테스트. 상품명과 보조 정보 표시를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { ProductSummary } from "./product-summary";

test("상품명을 보여준다", () => {
  render(<ProductSummary name="OOO 연어 사료 2kg" imageUrl="/product.png" />);
  expect(screen.getByText("OOO 연어 사료 2kg")).toBeDefined();
});

test("상품명이 옆에 있으므로 이미지는 장식으로 둔다", () => {
  render(<ProductSummary name="OOO 연어 사료 2kg" imageUrl="/product.png" />);
  expect(screen.getByRole("presentation")).toBeDefined();
});

test("보조 정보를 함께 보여준다", () => {
  render(<ProductSummary name="사료" imageUrl="/p.png" meta="31,200원 · 옵션 2kg" />);
  expect(screen.getByText("31,200원 · 옵션 2kg")).toBeDefined();
});
