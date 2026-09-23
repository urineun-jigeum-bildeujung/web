// 주문 상태 뱃지 테스트. 문구로 상태를 알리는지, 상태마다 시안의 색을 쓰는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { ORDER_STATUS_LABEL, ORDER_STATUSES, OrderStatusBadge } from "./order-status-badge";

test("모든 상태가 읽을 수 있는 문구를 가진다", () => {
  for (const status of ORDER_STATUSES) {
    const { unmount } = render(<OrderStatusBadge status={status} />);
    expect(screen.getByText(/결제완료|배송준비중|배송중|배송완료|구매확정/)).toBeDefined();
    unmount();
  }
});

test("배송중 상태를 문구로 보여준다", () => {
  render(<OrderStatusBadge status="shipping" />);
  expect(screen.getByText("배송중")).toBeDefined();
});

// 2026-09-23 시안부터 상태마다 색이 다르다. 받은 뒤의 두 단계는 같은 초록이다 (#405)
test.each([
  ["preparing", "bg-surface-secondary"],
  ["shipping", "bg-surface-info-weak"],
  ["delivered", "bg-surface-positive-weak"],
  ["confirmed", "bg-surface-positive-weak"],
] as const)("%s 뱃지는 %s 바탕이다", (status, background) => {
  render(<OrderStatusBadge status={status} />);
  expect(screen.getByText(ORDER_STATUS_LABEL[status]).className).toContain(background);
});
