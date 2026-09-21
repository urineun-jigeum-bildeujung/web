// 배송지 설정 테스트. 머리말이 서고 목록이 조회 결과를 그대로 받는지 본다.
//
// **목록이 무엇을 어떻게 그리는지는 여기서 보지 않는다.** `entities/address`의
// `address-place-list.test.tsx`가 값을 직접 넣어 시험한다 (#329).
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const useQueryAddresses = vi.fn();

// PageHeader의 뒤로가기가 useRouter를 쓴다
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

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

  expect(screen.getByRole("heading", { name: "배송지 설정" })).toBeDefined();
  expect(screen.getByText("집")).toBeDefined();
  expect(screen.getByRole("link", { name: /장소 추가하기/ })).toBeDefined();
});
