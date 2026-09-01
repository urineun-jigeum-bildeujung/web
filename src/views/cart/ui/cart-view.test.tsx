// 무엇이 합계에 들어가는지, 고른 것이 없을 때 결제로 넘어가지 못하는지 확인한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { CartView } from "./cart-view";

describe("CartView", () => {
  it("고른 상품만 합계에 들어간다", () => {
    render(<CartView />);

    // 45,000 + 26,000 + 19,000 = 90,000, 배송비 3,000
    expect(screen.getByText("93,000원")).toBeDefined();

    fireEvent.click(screen.getAllByLabelText("상품명 고르기")[0]);

    // 45,000이 빠져 45,000 + 3,000
    expect(screen.getByText("48,000원")).toBeDefined();
  });

  it("수량을 올리면 합계도 함께 오른다", () => {
    render(<CartView />);

    fireEvent.click(screen.getAllByLabelText("상품명 수량 하나 늘리기")[0]);

    expect(screen.getByText("138,000원")).toBeDefined();
  });

  it("아무것도 고르지 않으면 배송비도 붙지 않고 결제로 갈 수 없다", () => {
    render(<CartView />);

    fireEvent.click(screen.getByLabelText("전체선택"));

    // 결제금액·상품 옵션·배송비 세 줄이 모두 0원이 된다
    expect(screen.getAllByText("0원")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "결제하기" })).toHaveProperty("disabled", true);
  });

  it("상품을 빼면 목록과 합계에서 모두 사라진다", () => {
    render(<CartView />);

    fireEvent.click(screen.getAllByLabelText("상품명 빼기")[0]);
    fireEvent.click(screen.getByRole("button", { name: "상품 빼기" }));

    expect(screen.getAllByLabelText("상품명 고르기")).toHaveLength(2);
    expect(screen.getByText("48,000원")).toBeDefined();
  });
});
