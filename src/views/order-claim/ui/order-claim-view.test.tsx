// 취소·반품·교환 신청 화면 테스트. 진입 유형이 머리말에 서는지, 시안이 없는 동안
// 사용자가 갇히지 않는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { OrderClaimView } from "./order-claim-view";

test.each([
  ["cancel", "취소 신청"],
  ["return", "반품 신청"],
  ["exchange", "교환 신청"],
  [undefined, "취소·반품·교환 신청"],
])("type=%s이면 제목이 %s이다", (type, label) => {
  render(<OrderClaimView orderId="1" type={type} />);
  expect(screen.getByRole("heading", { name: label })).toBeDefined();
});

// 주문 상세의 확인창이 이 화면으로 데려온다. 빈 화면이면 눌러 놓고 갇힌다
test("시안이 없는 동안 까닭을 알리고 주문 상세로 돌아갈 길을 남긴다", () => {
  render(<OrderClaimView orderId="7" type="return" />);

  expect(screen.getByText("신청 화면을 준비하고 있어요")).toBeDefined();
  expect(screen.getByRole("link", { name: "주문 상세로 돌아가기" }).getAttribute("href")).toBe(
    "/mypage/orders/7",
  );
});

// 개발용 표시가 사용자에게 나가면 안 된다
test("주문 번호를 날것으로 보여주지 않는다", () => {
  render(<OrderClaimView orderId="7" type="return" />);

  expect(screen.queryByText(/orderId/)).toBeNull();
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});
