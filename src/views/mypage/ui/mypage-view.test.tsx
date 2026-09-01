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
  expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
});

test("아직 화면이 없는 항목은 누를 수 없다", () => {
  render(<MypageView />);

  // 알림과 서비스 안내는 시안에 자리는 있으나 갈 화면이 없다.
  // 누를 수 있게 두면 눌렀을 때 아무 일도 일어나지 않아 고장으로 읽힌다.
  expect(screen.queryByRole("link", { name: "알림" })).toBeNull();
  expect(screen.queryByRole("link", { name: /서비스 안내/ })).toBeNull();
  // 제목과 설명이 같은 문구라 둘 다 잡힌다. 자리가 남아 있는지만 본다.
  expect(screen.getAllByText("서비스 안내").length).toBeGreaterThan(0);
});
