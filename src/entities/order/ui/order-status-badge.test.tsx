// 주문 상태 뱃지 테스트. 색만이 아니라 문구로도 상태를 알리는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { ORDER_STATUSES, OrderStatusBadge } from "./order-status-badge";

test("모든 상태가 읽을 수 있는 문구를 가진다", () => {
  for (const status of ORDER_STATUSES) {
    const { unmount } = render(<OrderStatusBadge status={status} />);
    expect(screen.getByText(/결제완료|상품 준비|배송중|배송완료|구매확정/)).toBeDefined();
    unmount();
  }
});

test("배송중 상태를 문구로 보여준다", () => {
  render(<OrderStatusBadge status="shipping" />);
  expect(screen.getByText("배송중")).toBeDefined();
});
