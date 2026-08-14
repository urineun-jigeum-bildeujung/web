// 홈 화면 단위 테스트. 핵심 요소가 렌더링되는지 검증한다.
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
