// 상품 상세 수량 시트의 수량과 담기 동작을 확인한다.
import { fireEvent, render, screen } from "@testing-library/react";
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
        productName="면역 지원 영양제 90정"
        price={21_000}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "21,000원 바로 구매" }));

    expect(onConfirm).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: /장바구니 담기/ })).toBeNull();
  });
});
