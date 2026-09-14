// 무엇이 합계에 들어가는지, 고른 것이 없을 때 무엇이 보이지 않는지 확인한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import type { CartItem } from "../api/cart";
import { CartView } from "./cart-view";

const ITEMS: CartItem[] = [
  { id: "1", productId: "p1", name: "유산균", imageUrl: null, price: 19900, quantity: 1 },
  { id: "2", productId: "p2", name: "우피껌", imageUrl: null, price: 8000, quantity: 1 },
  { id: "3", productId: "p3", name: "한우스틱", imageUrl: null, price: 3900, quantity: 1 },
];

const renderCart = (items = ITEMS) => render(<CartView items={items} />);

describe("CartView", () => {
  // 시안은 아무것도 고르지 않은 상태로 시작한다
  it("처음에는 아무것도 고르지 않은 상태다", () => {
    renderCart();

    expect(screen.getByText("전체선택 (0/3)")).toBeDefined();
    expect(screen.getByRole("button", { name: "결제하기" })).toHaveProperty("disabled", true);
  });

  // 0원만 늘어놓아도 알려주는 것이 없고, 고르라는 신호가 흐려진다
  it("고른 것이 없으면 금액 줄을 아예 보여주지 않는다", () => {
    renderCart();

    expect(screen.queryByText("결제금액")).toBeNull();
    expect(screen.queryByText("판매가격")).toBeNull();
    expect(screen.queryByText("배송비")).toBeNull();
  });

  it("고른 상품만 합계에 들어간다", () => {
    renderCart();

    fireEvent.click(screen.getByLabelText("유산균 고르기"));

    // 19,900 + 배송비 3,000
    expect(screen.getByText("22,900원")).toBeDefined();

    fireEvent.click(screen.getByLabelText("우피껌 고르기"));

    // 19,900 + 8,000 + 3,000
    expect(screen.getByText("30,900원")).toBeDefined();
  });

  it("전체선택으로 한 번에 고르고 푼다", () => {
    renderCart();

    fireEvent.click(screen.getByLabelText("전체선택 (0/3)"));
    expect(screen.getByText("전체선택 (3/3)")).toBeDefined();

    // 19,900 + 8,000 + 3,900 + 3,000
    expect(screen.getByText("34,800원")).toBeDefined();
  });

  it("수량을 올리면 합계도 함께 오른다", () => {
    renderCart();

    fireEvent.click(screen.getByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("유산균 수량 하나 늘리기"));

    // 19,900 × 2 + 3,000
    expect(screen.getByText("42,800원")).toBeDefined();
  });

  it("상품을 빼면 목록과 합계에서 모두 사라진다", () => {
    renderCart();

    fireEvent.click(screen.getByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("유산균 빼기"));
    fireEvent.click(screen.getByRole("button", { name: "상품 빼기" }));

    expect(screen.queryByLabelText("유산균 고르기")).toBeNull();
    expect(screen.getByText("전체선택 (0/2)")).toBeDefined();
  });

  // 목데이터가 늘 차 있어 빈 상태가 화면에서 도달하지 않았다. 조회 결과를 받도록 바꿔 덮는다
  it("담은 것이 없으면 비었다고 알린다", () => {
    renderCart([]);

    expect(screen.getByText("장바구니가 비었어요")).toBeDefined();
    expect(screen.queryByText(/전체선택/)).toBeNull();
  });
});
