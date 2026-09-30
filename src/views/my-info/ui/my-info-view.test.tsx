// 내 정보 테스트. 서버에서 온 값을 어떻게 보이는지와 아직 없는 값 처리를 검증한다.
import { render, screen, within } from "@testing-library/react";
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

const query: { profile: Profile | undefined; isLoading: boolean; error: Error | null } = {
  profile: {
    nickname: "신나는강아지813",
    name: null,
    birth: null,
    phone: null,
    image: null,
    email: "me@example.com",
  },
  isLoading: false,
  error: null,
};

/** 아이·배송지도 각자 실패할 수 있다 */
const others = { petsError: null as Error | null, addressesError: null as Error | null };

vi.mock("@/entities/member", () => ({
  useQueryMyProfile: () => ({
    profile: query.profile,
    isLoading: query.isLoading,
    error: query.error,
  }),
}));
// 아이 원(`PetPhoto`)은 진짜를 쓴다. 사진과 이름 앞 글자가 실제로 그려지는지 봐야 한다
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets: () => ({
    pets: [
      {
        id: "1",
        name: "코코",
        photoUrl: "https://image.leechs.shop/pets/1.jpg",
        isDefault: true,
      },
      { id: "2", name: "구름이", isDefault: false },
    ],
    isLoading: false,
    error: others.petsError,
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
    error: others.addressesError,
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
  query.error = null;
  others.petsError = null;
  others.addressesError = null;
});

test("머리말과 닉네임이 서버 값이다", () => {
  renderView();

  expect(screen.getByRole("heading", { name: "신나는강아지813님의 정보" })).toBeDefined();
  expect(screen.getByRole("link", { name: /닉네임/ })).toBeDefined();
});

// 생년월일·휴대폰은 아직 받는 자리가 없어 비어 온다. 빈 칸으로 두면 고장으로 읽힌다
test("아직 없는 값은 등록 전이라고 알린다", () => {
  renderView();

  expect(screen.getAllByText("등록 전이에요").length).toBeGreaterThan(0);
});

test("받은 생년월일은 한국어로 풀어 보인다", () => {
  query.profile = { ...query.profile!, birth: "2000-12-13" };
  renderView();

  expect(screen.getByText("2000년 12월 13일")).toBeDefined();
});

// 이름 항목은 PM이 뺐다. 줄이 남아 있으면 고칠 수도 없는 값을 묻는다 (QA No.141)
test("이름 줄이 없다", () => {
  renderView();

  expect(screen.queryByText("이름")).toBeNull();
  expect(
    screen.getAllByRole("link").some((link) => link.getAttribute("href") === "/mypage/info/name"),
  ).toBe(false);
});

// 이름만 이어 붙이면 어느 아이인지 한눈에 들어오지 않는다. 사진이 없는 아이는
// 이름 앞 두 글자를 원에 넣는다 (QA No.141)
test("내 아이들은 아이마다 사진 원과 이름을 함께 보인다", () => {
  renderView();

  const row = screen.getByRole("link", { name: /내 아이들/ });
  expect(row.textContent).toContain("코코");
  expect(row.textContent).toContain("구름이");
  // 코코는 사진, 구름이는 사진이 없어 앞 두 글자다
  expect(row.querySelectorAll("img")).toHaveLength(1);
  expect(within(row).getByText("구름")).toBeDefined();
});

test("배송지는 도로명과 상세를 이어 보이고 기본에 표시를 단다", () => {
  renderView();

  expect(screen.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층")).toBeDefined();
  expect(screen.getByText("기본 배송지")).toBeDefined();
});

// 돌아올 곳을 싣지 않으면 배송지 화면이 저장 뒤 한 칸 되돌리기로 떠난다. 주소를 새로 골랐으면
// 그 한 칸이 주소 검색 화면이라, 내 정보 관리로 돌아오지 못했다 (QA No.178)
test("배송지 줄과 장소 추가는 저장 뒤 돌아올 곳으로 이 화면을 싣는다", () => {
  renderView();

  const queryOf = (name: RegExp) =>
    new URLSearchParams(screen.getByRole("link", { name }).getAttribute("href")!.split("?")[1]);
  const edit = queryOf(/테헤란로 123/);
  expect(edit.get("place")).toBe("1");
  expect(edit.get("from")).toBe("/mypage/info");
  expect(queryOf(/장소 추가하기/).get("from")).toBe("/mypage/info");
});

// 값 자리만 자리를 잡는다. 줄과 레이블은 서버에서 오는 것이 아니다
test("불러오는 동안 값 자리를 잡아 둔다", () => {
  query.profile = undefined;
  query.isLoading = true;
  renderView();

  expect(screen.getByRole("heading", { name: "내 정보" })).toBeDefined();
  expect(screen.queryByText("등록 전이에요")).toBeNull();
});

// 못 받은 것과 비어 있는 것은 다른 사실이다. "등록 전이에요"로 두면 보호자는
// 적어 넣으면 되는 줄 알고 적을 자리를 찾다 헤맨다
test("회원 정보를 못 받으면 등록 전이 아니라 실패를 알린다", () => {
  query.profile = undefined;
  query.error = new Error("500");
  renderView();

  expect(screen.getAllByText("불러오지 못했어요").length).toBeGreaterThan(0);
  expect(screen.queryByText("등록 전이에요")).toBeNull();
});

test("아이 목록을 못 받으면 등록 전이 아니라 실패를 알린다", () => {
  others.petsError = new Error("500");
  renderView();

  expect(screen.getByText("불러오지 못했어요")).toBeDefined();
});

// 빈 목록으로 두면 보호자는 자기가 넣은 배송지가 사라진 줄 안다
test("배송지를 못 받으면 그 사실을 알린다", () => {
  others.addressesError = new Error("500");
  renderView();

  expect(screen.getByRole("alert").textContent).toContain("배송지를 불러오지 못했어요");
});
