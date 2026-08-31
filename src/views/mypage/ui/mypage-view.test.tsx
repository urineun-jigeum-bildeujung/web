// 마이페이지 홈 테스트. 메뉴 묶음과 이동 경로를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

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
  expect(screen.getByRole("link", { name: /결제 수단 관리/ }).getAttribute("href")).toBe(
    "/mypage/payment",
  );
});

test("헤더에 장바구니와 알림이 읽을 수 있는 이름으로 있다", () => {
  render(<MypageView />);

  expect(screen.getByRole("link", { name: "장바구니" })).toBeDefined();
  expect(screen.getByRole("link", { name: "알림" })).toBeDefined();
});
