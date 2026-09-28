// 서비스 안내 테스트. 두 입구가 각 문서로 이어지는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { ServiceView } from "./service-view";

test("서비스 이용약관과 개인정보 처리방침이 각 화면으로 이어진다", () => {
  render(<ServiceView />);

  expect(screen.getByRole("link", { name: /서비스 이용약관/ }).getAttribute("href")).toBe(
    "/mypage/service/terms",
  );
  expect(screen.getByRole("link", { name: /개인정보 처리방침/ }).getAttribute("href")).toBe(
    "/mypage/service/privacy",
  );
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});
