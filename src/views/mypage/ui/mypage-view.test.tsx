// 마이페이지 홈 테스트. 메뉴 묶음과 이동 경로를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/mypage",
}));

import { MypageView } from "./mypage-view";

test("메뉴를 세 묶음으로 보여준다", () => {
  render(<MypageView />);

  for (const title of ["나의 쇼핑", "혜택과 결제", "고객지원"]) {
    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  }
});

test("각 메뉴가 제 경로로 이어진다", () => {
  render(<MypageView />);

  expect(screen.getByRole("link", { name: /재입고 알림/ }).getAttribute("href")).toBe(
    "/mypage/restock",
  );
  expect(screen.getByRole("link", { name: /최근 본 상품/ }).getAttribute("href")).toBe(
    "/mypage/recently-viewed",
  );
  expect(screen.getByRole("link", { name: /결제 수단 관리/ }).getAttribute("href")).toBe(
    "/mypage/payment",
  );
  expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
});

test("알림·서비스 안내가 각 화면으로 이어진다", () => {
  render(<MypageView />);

  expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
    "/mypage/notifications",
  );
  expect(screen.getByRole("link", { name: /서비스 안내/ }).getAttribute("href")).toBe(
    "/mypage/service",
  );
});

test("반려동물 프로필 영역이 마이페이지_반려동물 화면으로 이어진다", () => {
  render(<MypageView />);

  expect(screen.getByRole("link", { name: "반려동물 프로필 관리" }).getAttribute("href")).toBe(
    "/mypage/pets",
  );
});
