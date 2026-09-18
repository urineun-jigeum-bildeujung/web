// 마이페이지 홈 테스트. 메뉴 묶음과 이동 경로를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/mypage",
}));

// 아이 원 줄이 목록을 서버에서 받는다(#230)
let petsQuery: { pets: unknown; isLoading: boolean; error: null } = {
  pets: [
    { id: "3", name: "코코", isDefault: true },
    { id: "7", name: "보리", isDefault: false },
  ],
  isLoading: false,
  error: null,
};

vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets: () => petsQuery,
}));

import { MypageView } from "./mypage-view";

function renderView() {
  return render(<MypageView />, { wrapper: createQueryWrapper() });
}

test("메뉴를 세 묶음으로 보여준다", () => {
  renderView();

  for (const title of ["나의 쇼핑", "혜택과 결제", "고객지원"]) {
    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  }
});

test("각 메뉴가 제 경로로 이어진다", () => {
  renderView();

  expect(screen.getByRole("link", { name: /재입고 알림/ }).getAttribute("href")).toBe(
    "/mypage/restock",
  );
  // 시안에서 빠진 메뉴. 화면은 남아 있지만 여기서 들어가지 않는다
  expect(screen.queryByRole("link", { name: /최근 본 상품/ })).toBeNull();
  expect(screen.getByRole("link", { name: /결제 수단 관리/ }).getAttribute("href")).toBe(
    "/mypage/payment",
  );
  expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
});

test("알림·서비스 안내가 각 화면으로 이어진다", () => {
  renderView();

  expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
    "/mypage/notifications",
  );
  expect(screen.getByRole("link", { name: /서비스 안내/ }).getAttribute("href")).toBe(
    "/mypage/service",
  );
});

test("반려동물 프로필 영역이 마이페이지_반려동물 화면으로 이어진다", () => {
  renderView();

  expect(screen.getByRole("link", { name: "반려동물 프로필 관리" }).getAttribute("href")).toBe(
    "/mypage/pets",
  );
});

// 원이 목이던 동안에는 등록한 아이가 둘이 아니어도 늘 둘이 떴다
test("아이 원을 서버에서 받은 목록으로 그린다", () => {
  renderView();

  expect(screen.getByTitle("코코")).toBeDefined();
  expect(screen.getByTitle("보리")).toBeDefined();
});

// 원이 없다가 생기면 뒤따르는 점선 원이 왼쪽에 붙어 있다가 오른쪽으로 밀린다
test("목록을 받는 동안 원 자리를 잡아 둔다", () => {
  petsQuery = { pets: undefined, isLoading: true, error: null };
  renderView();

  expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
  petsQuery = {
    pets: [
      { id: "3", name: "코코", isDefault: true },
      { id: "7", name: "보리", isDefault: false },
    ],
    isLoading: false,
    error: null,
  };
});
