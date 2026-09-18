// 배송지 설정 테스트. 저장해 둔 곳을 어떻게 갈라 보여주는지 본다.
//
// 조회는 가짜로 둔다. 무엇을 보내고 받은 것을 어떻게 다루는지는 `entities/address`가 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";

const useQueryAddresses = vi.fn();

// PageHeader의 뒤로가기가 useRouter를 쓴다
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/entities/address", () => ({
  useQueryAddresses: () => useQueryAddresses(),
}));

import { CheckoutAddressView } from "./checkout-address-view";

/** 명세 예시 JSON을 옮긴 값 */
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

const STUDIO = {
  ...HOME,
  addressId: 9,
  addressName: "자취방",
  addressDetail: "3층",
  isDefault: false,
};

function renderWith(state: Partial<ReturnType<typeof useQueryAddresses>>) {
  useQueryAddresses.mockReturnValue({
    addresses: undefined,
    isLoading: false,
    error: null,
    ...state,
  });
  return render(<CheckoutAddressView />);
}

test("저장해 둔 장소를 이름과 주소로 보여준다", () => {
  renderWith({ addresses: [HOME, STUDIO] });

  expect(screen.getByText("집")).toBeDefined();
  expect(screen.getByText("자취방")).toBeDefined();
  expect(screen.getByText("기본 배송지")).toBeDefined();
});

// 도로명과 상세주소가 따로 온다. 한쪽만 보이면 몇 층인지 알 수 없다
test("도로명과 상세주소를 한 줄로 붙여 보여준다", () => {
  renderWith({ addresses: [HOME] });

  expect(screen.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층 404호")).toBeDefined();
});

// 서버는 종류를 내려주지 않는다. 화면이 addressName으로 골라 붙인다
test("집·회사에만 아이콘이 붙고 사용자가 지은 이름에는 없다", () => {
  const { container } = renderWith({ addresses: [HOME, STUDIO] });

  const rows = [...container.querySelectorAll("a")];
  const fixed = rows.find((row) => row.textContent?.includes("집"));
  const custom = rows.find((row) => row.textContent?.includes("자취방"));

  // 화살표는 모든 줄에 있으므로 아이콘이 하나뿐이면 장소 아이콘이 없다는 뜻이다
  expect(fixed?.querySelectorAll("svg").length).toBe(2);
  expect(custom?.querySelectorAll("svg").length).toBe(1);
});

// 고른 줄의 addressId를 들고 가야 그 배송지를 고칠 수 있다
test("줄을 누르면 그 배송지를 들고 간다", () => {
  renderWith({ addresses: [HOME] });

  const row = screen.getByRole("link", { name: /집/ }) as HTMLAnchorElement;
  expect(row.getAttribute("href")).toBe("/mypage/address/new?place=5");
});

// 픽스처의 집이 기본이면서 이름 묶음이기도 해서, 묶음을 먼저 그리는 회귀가 있어도
// 위 테스트들은 통과한다. **기본을 custom 이름으로 두고 비기본을 집으로 둬야** 그 하나를 겨눈다 (#239 리뷰)
test("기본 배송지는 이름과 무관하게 맨 앞에 온다", () => {
  const defaultCustom = { ...STUDIO, isDefault: true };
  const namedNonDefault = { ...HOME, isDefault: false };

  renderWith({ addresses: [defaultCustom, namedNonDefault] });

  const rows = screen
    .getAllByRole("link")
    .filter((row) => !/장소 추가하기/.test(row.textContent ?? ""));
  expect(rows[0].textContent).toContain("자취방");
  expect(rows[1].textContent).toContain("집");
});

// 재조회가 실패하면 앞서 받아 둔 값이 남는다. 함께 그리면 오류 문구 아래로 옛 배송지가 따라 나온다
test("불러오지 못하면 앞서 받은 목록을 그리지 않는다", () => {
  renderWith({ addresses: [HOME], error: new ApiError(500, "실패") });

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.queryByText("집")).toBeNull();
});

test("하나도 없으면 넣으라고 알린다", () => {
  renderWith({ addresses: [] });

  expect(screen.getByText("등록된 배송지가 없어요")).toBeDefined();
});

// 조회 실패는 토스트가 아니라 화면이 직접 보여준다. 사라지면 왜 비었는지 알 수 없다
test("불러오지 못하면 그 사실을 화면에 남긴다", () => {
  renderWith({ error: new ApiError(500, "실패") });

  expect(screen.getByRole("alert")).toBeDefined();
});

test("찾는 동안 뼈대를 보여준다", () => {
  renderWith({ isLoading: true });

  expect(screen.getByRole("status")).toBeDefined();
});

test("장소를 더 넣을 수 있다", () => {
  renderWith({ addresses: [HOME] });

  const link = screen.getByRole("link", { name: /장소 추가하기/ });
  expect(link.getAttribute("href")).toBe("/mypage/address/new");
});
