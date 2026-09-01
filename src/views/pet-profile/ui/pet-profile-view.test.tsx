// 반려동물 프로필 테스트. 탭 전환과 제품 후기 시트를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { PetProfileView } from "./pet-profile-view";

function renderView(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <PetProfileView />
    </NuqsTestingAdapter>,
  );
}

test("기본은 내 아이 관리 탭이다", () => {
  renderView();

  expect(screen.getByRole("tab", { name: "내 아이 관리" }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getByText("걱정되는 질환")).toBeDefined();
});

test("주소창의 탭 값을 따른다", () => {
  // 목록에서 상세로 갔다 돌아와도 보던 탭이 남아야 한다
  renderView("?tab=products");

  expect(screen.getByRole("tab", { name: "아이 제품 관리" }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getAllByText(/구매일/).length).toBeGreaterThan(0);
});

test("제품을 누르면 후기가 열린다", () => {
  renderView("?tab=products");

  fireEvent.click(screen.getAllByRole("button", { name: /상품명/ })[0]);
  expect(screen.getByText("이런 점이 좋았어요")).toBeDefined();
  expect(screen.getByText("이런 점은 조금 아쉬워요")).toBeDefined();
});

test("아이를 고르면 그 아이가 선택 상태가 된다", () => {
  renderView();

  const [first, second] = screen.getAllByRole("radio");
  expect(first.getAttribute("aria-checked")).toBe("true");

  fireEvent.click(second);
  expect(second.getAttribute("aria-checked")).toBe("true");
  expect(first.getAttribute("aria-checked")).toBe("false");
});
