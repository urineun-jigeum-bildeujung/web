// 상품 상세 수량 시트의 수량과 담기 동작, 상품 사진, 이미 담긴 상품 표시를 확인한다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DetailOptionSheet } from "./detail-option-sheet";

describe("DetailOptionSheet", () => {
  it("수량을 바꾸면 장바구니 금액과 전달 수량이 함께 바뀐다", () => {
    const onAddToCart = vi.fn();

    render(
      <DetailOptionSheet
        open
        onOpenChange={vi.fn()}
        onConfirm={onAddToCart}
        inCartQuantity={0}
        onRemoveFromCart={vi.fn()}
        productName="면역 지원 영양제 90정"
        quantityLabel="90정"
        price={21_000}
      />,
    );

    expect(screen.getByRole("button", { name: "21,000원 장바구니 담기" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "면역 지원 영양제 90정 수량 하나 늘리기" }));
    fireEvent.click(screen.getByRole("button", { name: "42,000원 장바구니 담기" }));

    expect(onAddToCart).toHaveBeenCalledWith(2);
  });

  // 바로 구매도 같은 시트에서 수량을 고른다. 글자만 바뀐다 (#520)
  it("바로 구매로 열면 버튼이 바로 구매이고 고른 수량을 넘긴다", () => {
    const onConfirm = vi.fn();

    render(
      <DetailOptionSheet
        open
        onOpenChange={vi.fn()}
        action="buy"
        onConfirm={onConfirm}
        inCartQuantity={0}
        onRemoveFromCart={vi.fn()}
        productName="면역 지원 영양제 90정"
        price={21_000}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "21,000원 바로 구매" }));

    expect(onConfirm).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: /장바구니 담기/ })).toBeNull();
  });

  // 시안(1702-16392)은 상품 사진인데 회색 네모만 있었다 (#562). 옆에 상품명이 있어 사진은 장식이다
  it("상품 사진이 있으면 그 사진을 장식으로 그리고, 없으면 회색 자리를 둔다", () => {
    const { rerender } = render(
      <DetailOptionSheet
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        inCartQuantity={0}
        onRemoveFromCart={vi.fn()}
        productName="면역 지원 영양제 90정"
        imageUrl="https://image.leechs.shop/products/1.jpg"
        price={21_000}
      />,
    );

    const photo = within(screen.getByRole("dialog")).getByRole("presentation");
    expect(photo.tagName).toBe("IMG");
    expect(photo.getAttribute("src")).toContain(
      encodeURIComponent("https://image.leechs.shop/products/1.jpg"),
    );

    rerender(
      <DetailOptionSheet
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        inCartQuantity={0}
        onRemoveFromCart={vi.fn()}
        productName="면역 지원 영양제 90정"
        price={21_000}
      />,
    );

    expect(within(screen.getByRole("dialog")).queryByRole("presentation")).toBeNull();
  });

  // 다시 담으면 서버가 수량을 더하는데, 전에는 이미 담겨 있다는 사실이 어디에도 없었다 (#562)
  describe("이미 담긴 상품", () => {
    it("장바구니에 담긴 수를 알리고 빼기를 누르면 장바구니에서 뺀다", () => {
      const onRemoveFromCart = vi.fn();

      render(
        <DetailOptionSheet
          open
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          inCartQuantity={2}
          onRemoveFromCart={onRemoveFromCart}
          productName="면역 지원 영양제 90정"
          price={21_000}
        />,
      );

      expect(screen.getByText("장바구니에 2개 담겨 있어요")).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "장바구니에서 빼기" }));

      expect(onRemoveFromCart).toHaveBeenCalledOnce();
    });

    it("담긴 것이 없으면 알리지 않는다", () => {
      render(
        <DetailOptionSheet
          open
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          inCartQuantity={0}
          onRemoveFromCart={vi.fn()}
          productName="면역 지원 영양제 90정"
          price={21_000}
        />,
      );

      expect(screen.queryByText(/담겨 있어요/)).toBeNull();
      expect(screen.queryByRole("button", { name: "장바구니에서 빼기" })).toBeNull();
    });

    // 바로 구매는 장바구니를 거치지 않는다
    it("바로 구매로 열면 담긴 수를 알리지 않는다", () => {
      render(
        <DetailOptionSheet
          open
          onOpenChange={vi.fn()}
          action="buy"
          onConfirm={vi.fn()}
          inCartQuantity={2}
          onRemoveFromCart={vi.fn()}
          productName="면역 지원 영양제 90정"
          price={21_000}
        />,
      );

      expect(screen.queryByText(/담겨 있어요/)).toBeNull();
    });
  });
});
