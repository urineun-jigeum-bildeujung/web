// 내 정보 테스트. 서버에서 온 값을 어떻게 보이는지와 아직 없는 값 처리를 검증한다.
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

// 회원 정보·아이·배송지 셋을 서버에서 받는다(#266). 무엇을 부르는지는 각 api 테스트가 본다
type Profile = {
  nickname: string;
  name: string | null;
  birth: string | null;
  phone: string | null;
  image: string | null;
  email: string;
};

const query: { profile: Profile | undefined; isLoading: boolean } = {
  profile: {
    nickname: "신나는강아지813",
    name: null,
    birth: null,
    phone: null,
    image: null,
    email: "me@example.com",
  },
  isLoading: false,
};

vi.mock("@/entities/member", () => ({
  useQueryMyProfile: () => ({ profile: query.profile, isLoading: query.isLoading, error: null }),
}));
vi.mock("@/entities/pet", () => ({
  useQueryPets: () => ({
    pets: [
      { id: "1", name: "코코", isDefault: true },
      { id: "2", name: "보리", isDefault: false },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/entities/address", () => ({
  useQueryAddresses: () => ({
    addresses: [
      {
        addressId: 1,
        addressName: "집",
        receiver: "권도형",
        phone: "01012345678",
        zipCode: "06234",
        address: "서울특별시 강남구 테헤란로 123",
        addressDetail: "UI타워 4층",
        deliveryNote: null,
        isDefault: true,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

import { MyInfoView } from "./my-info-view";

function renderView() {
  return render(<MyInfoView />, { wrapper: createQueryWrapper() });
}

beforeEach(() => {
  query.profile = {
    nickname: "신나는강아지813",
    name: null,
    birth: null,
    phone: null,
    image: null,
    email: "me@example.com",
  };
  query.isLoading = false;
});

test("머리말과 닉네임이 서버 값이다", () => {
  renderView();

  expect(screen.getByRole("heading", { name: "신나는강아지813님의 정보" })).toBeDefined();
  expect(screen.getByRole("link", { name: /닉네임/ })).toBeDefined();
});

// 이름·생년월일·휴대폰은 아직 받는 자리가 없어 비어 온다. 빈 칸으로 두면 고장으로 읽힌다
test("아직 없는 값은 등록 전이라고 알린다", () => {
  renderView();

  expect(screen.getAllByText("등록 전이에요").length).toBeGreaterThan(0);
});

test("받은 생년월일은 한국어로 풀어 보인다", () => {
  query.profile = { ...query.profile!, birth: "2000-12-13" };
  renderView();

  expect(screen.getByText("2000년 12월 13일")).toBeDefined();
});

test("내 아이들에 등록한 아이 이름이 이어 붙는다", () => {
  renderView();

  expect(screen.getByText("코코, 보리")).toBeDefined();
});

test("배송지는 도로명과 상세를 이어 보이고 기본에 표시를 단다", () => {
  renderView();

  expect(screen.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층")).toBeDefined();
  expect(screen.getByText("기본 배송지")).toBeDefined();
});

// 값 자리만 자리를 잡는다. 줄과 레이블은 서버에서 오는 것이 아니다
test("불러오는 동안 값 자리를 잡아 둔다", () => {
  query.profile = undefined;
  query.isLoading = true;
  renderView();

  expect(screen.getByRole("heading", { name: "내 정보" })).toBeDefined();
  expect(screen.queryByText("등록 전이에요")).toBeNull();
});
