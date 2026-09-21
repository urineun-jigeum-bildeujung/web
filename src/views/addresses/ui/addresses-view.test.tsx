// 배송지 관리 테스트. 자리 표시가 아니라 실제 목록을 그리는지 본다 (#329).
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const useQueryAddresses = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

vi.mock("@/entities/address", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/address")>()),
  useQueryAddresses: () => useQueryAddresses(),
}));

import { AddressesView } from "./addresses-view";

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

test("등록해 둔 배송지를 보여주고 고치러 갈 수 있다", () => {
  useQueryAddresses.mockReturnValue({ addresses: [HOME], isLoading: false, error: null });
  render(<AddressesView />);

  expect(screen.getByRole("heading", { name: "배송지 관리" })).toBeDefined();
  expect(screen.getByRole("link", { name: /집/ }).getAttribute("href")).toBe(
    "/mypage/address/new?place=5",
  );
});

// 개발용 문구가 사용자에게 나가면 안 된다
test("자리 표시 문구가 남아 있지 않다", () => {
  useQueryAddresses.mockReturnValue({ addresses: [], isLoading: false, error: null });
  render(<AddressesView />);

  expect(screen.queryByText(/자리 표시/)).toBeNull();
  expect(screen.queryByText(/디자인 확정 전/)).toBeNull();
});
