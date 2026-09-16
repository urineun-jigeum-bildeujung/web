// 로그인 화면 테스트. 소셜 두 갈래가 게이트웨이 시작 주소로 이어지는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { LoginView } from "./login-view";

// 환경변수를 비운 기본값이다. 배포 환경에서는 게이트웨이 주소가 앞에 붙는다
test("소셜 버튼은 인가 시작 주소로 나가는 링크다", () => {
  render(<LoginView />);

  expect(screen.getByRole("link", { name: "카카오로 시작하기" }).getAttribute("href")).toBe(
    "/api/auth/oauth2/authorization/kakao",
  );
  expect(screen.getByRole("link", { name: "구글로 시작하기" }).getAttribute("href")).toBe(
    "/api/auth/oauth2/authorization/google",
  );
});

// 시안에는 넷이 그려져 있으나 인증 정책이 카카오·구글로 확정됐다
test("소셜은 카카오·구글 둘뿐이다", () => {
  render(<LoginView />);

  expect(screen.queryByRole("link", { name: /네이버/ })).toBeNull();
  expect(screen.queryByRole("link", { name: /애플/ })).toBeNull();
});

test("회원가입으로 갈 수 있다", () => {
  render(<LoginView />);

  expect(screen.getByRole("link", { name: "회원가입" }).getAttribute("href")).toBe("/signup");
});
