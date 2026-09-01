// 취소·반품·교환 작성 화면 테스트. type 쿼리에 따라 제목이 바뀌는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { OrderClaimView } from "./order-claim-view";

test.each([
  ["cancel", "취소"],
  ["return", "반품"],
  ["exchange", "교환"],
  [undefined, "취소·반품·교환"],
])("type=%s이면 제목이 %s이다", (type, label) => {
  render(<OrderClaimView orderId="1" type={type} />);
  expect(screen.getByRole("heading", { name: label })).toBeDefined();
});
