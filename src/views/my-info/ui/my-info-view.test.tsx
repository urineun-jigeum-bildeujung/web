// 내 정보 테스트. 항목 표시와 배송지 빈 값 처리를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { MyInfoView } from "./my-info-view";

test("회원 정보 항목을 값과 함께 보여준다", () => {
  render(<MyInfoView />);

  expect(screen.getByRole("link", { name: /닉네임/ })).toBeDefined();
  expect(screen.getByText("010-1234-5678")).toBeDefined();
});

test("기본 배송지에 표시를 단다", () => {
  render(<MyInfoView />);
  expect(screen.getByText("기본 배송지")).toBeDefined();
});

test("주소가 없는 배송지는 안내 문구를 보여준다", () => {
  render(<MyInfoView />);
  expect(screen.getByText("상품을 배송받을 주소를 입력해 주세요.")).toBeDefined();
});
