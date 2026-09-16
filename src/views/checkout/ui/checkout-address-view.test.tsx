// 배송지 설정 테스트. 고정 장소와 추가한 장소가 다르게 보이는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { CheckoutAddressView } from "./checkout-address-view";

test("저장해 둔 장소를 이름과 주소로 보여준다", () => {
  render(<CheckoutAddressView />);

  for (const label of ["집", "회사", "자취방"]) {
    expect(screen.getByText(label)).toBeDefined();
  }
  expect(screen.getByText("기본 배송지")).toBeDefined();
});

// 주소를 아직 넣지 않은 곳은 빈칸이 아니라 무엇을 해야 하는지 알린다
test("주소가 없으면 넣으라고 안내한다", () => {
  render(<CheckoutAddressView />);
  expect(screen.getByText("상품을 배송받을 주소를 입력해 주세요.")).toBeDefined();
});

// 시안(paym_011)은 집·회사에만 아이콘을 두고 사용자가 더한 곳은 이름만 보여준다
test("사용자가 더한 장소에는 아이콘이 없다", () => {
  const { container } = render(<CheckoutAddressView />);

  const rows = [...container.querySelectorAll("a")];
  const custom = rows.find((row) => row.textContent?.includes("자취방"));
  const fixed = rows.find((row) => row.textContent?.includes("집"));

  // 화살표는 모든 줄에 있으므로 아이콘이 하나뿐이면 장소 아이콘이 없다는 뜻이다
  expect(custom?.querySelectorAll("svg").length).toBe(1);
  expect(fixed?.querySelectorAll("svg").length).toBe(2);
});

test("장소를 더 넣을 수 있다", () => {
  render(<CheckoutAddressView />);

  const link = screen.getByRole("link", { name: /장소 추가하기/ });
  expect(link.getAttribute("href")).toBe("/mypage/address/new");
});
