// 홈 화면 테스트. 만들어 둔 화면으로 가는 입구가 있는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { HomeView } from "./home-view";

test("서비스명 제목이 렌더링된다", () => {
  render(<HomeView />);
  expect(screen.getByRole("heading", { level: 1, name: "골라주개냥" })).toBeDefined();
});

test("다크 모드 토글 버튼이 렌더링된다", () => {
  render(<HomeView />);
  expect(screen.getByRole("button", { name: "다크 모드로 전환" })).toBeDefined();
});

test("만들어 둔 화면으로 가는 링크를 묶어서 보여준다", () => {
  render(<HomeView />);

  for (const group of ["온보딩", "마이페이지", "개발용"]) {
    expect(screen.getByRole("heading", { level: 2, name: group })).toBeDefined();
  }
});

test("링크가 실제 라우트를 가리킨다", () => {
  render(<HomeView />);

  expect(screen.getByRole("link", { name: /마이페이지 홈/ }).getAttribute("href")).toBe("/mypage");
  expect(screen.getByRole("link", { name: /품종 선택/ }).getAttribute("href")).toBe(
    "/onboarding?step=breed",
  );
});
