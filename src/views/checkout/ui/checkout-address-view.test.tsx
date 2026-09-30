// 배송지 설정 테스트. 머리말이 서고 목록이 조회 결과를 그대로 받는지 본다.
//
// **목록이 무엇을 어떻게 그리는지는 여기서 보지 않는다.** `entities/address`의
// `address-place-list.test.tsx`가 값을 직접 넣어 시험한다 (#329).
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const useQueryAddresses = vi.fn();

// PageHeader의 뒤로가기가 useRouter를 쓴다
// 목록은 결제 화면이 실어 보낸 쿼리(고른 상품)를 읽는다
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => searchParams,
}));

// **모듈을 통째로 갈아끼우지 않는다.** 목록 컴포넌트가 같은 슬라이스에 있어 함께 사라진다
vi.mock("@/entities/address", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/address")>()),
  useQueryAddresses: () => useQueryAddresses(),
}));

import { CheckoutAddressView } from "./checkout-address-view";

const HOME = {
  addressId: 5,
  addressName: "집",
  receiver: "홍길동",
  phone: "010-1234-5678",
  zipCode: "06133",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "UI타워 4층 404호",
  deliveryNote: null,
  isDefault: true,
};

test("머리말이 서고 저장해 둔 장소가 목록에 온다", () => {
  useQueryAddresses.mockReturnValue({ addresses: [HOME], isLoading: false, error: null });
  render(<CheckoutAddressView />);

  // 시안은 제목 없이 뒤로가기만 둔다. 화면 이름은 스크린 리더에만 남는다 (#448)
  expect(screen.getByRole("heading", { name: "배송지 설정" }).className).toContain("sr-only");
  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
  expect(screen.getByText("집")).toBeDefined();
  expect(screen.getByRole("link", { name: /장소 추가하기/ })).toBeDefined();
});

// 결제 중에는 줄이 이번 주문 배송지를 고르는 자리다. 기본 배송지는 바꾸지 않는다 (QA No.40, #595)
test("줄을 누르면 고른 상품을 그대로 들고 그 배송지로 결제 화면에 돌아간다", () => {
  searchParams = new URLSearchParams({ items: "NORMAL:1" });
  useQueryAddresses.mockReturnValue({ addresses: [HOME], isLoading: false, error: null });
  render(<CheckoutAddressView />);

  expect(screen.getByRole("link", { name: "집" }).getAttribute("href")).toBe(
    "/payment?items=NORMAL%3A1&address=5",
  );
  // 고치고 오면 이 목록으로, 고른 상품을 든 채 돌아온다 (#369)
  const edit = screen.getByRole("link", { name: "집 수정" });
  const query = new URLSearchParams(edit.getAttribute("href")!.split("?")[1]);
  expect(query.get("from")).toBe("/payment/address?items=NORMAL%3A1");
});
