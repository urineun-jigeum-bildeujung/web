// 판매 상태별로 배지가 붙는지 본다. 판매 중에는 아무것도 그리지 않는다(#600).
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SaleStatusBadge } from "./sale-status-badge";

test("품절·타임딜은 글자로 알리고 판매 중은 그리지 않는다", () => {
  const { container, rerender } = render(<SaleStatusBadge status="soldOut" />);
  expect(screen.getByText("품절")).toBeDefined();

  rerender(<SaleStatusBadge status="timeDeal" />);
  expect(screen.getByText("타임딜")).toBeDefined();

  rerender(<SaleStatusBadge status="onSale" />);
  expect(container.textContent).toBe("");
});
