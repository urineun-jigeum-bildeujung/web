// 아이 관리 테스트. 탭 전환과 반응 시트, 거르기를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

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

  expect(screen.getByRole("tab", { name: /내 아이 관리/ }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getByText("걱정되는 질환 · 알러지")).toBeDefined();
});

test("정보 줄의 화살표가 각 수정 화면으로 간다", () => {
  renderView();

  expect(screen.getByRole("link", { name: "기본 정보 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/basic",
  );
  expect(screen.getByRole("link", { name: "체형 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/body",
  );
  expect(screen.getByRole("link", { name: "건강 정보 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/health",
  );
});

test("주소창의 탭 값을 따른다", () => {
  // 목록에서 상세로 갔다 돌아와도 보던 탭이 남아야 한다
  renderView("?tab=products");

  expect(screen.getByRole("tab", { name: /아이 제품 관리/ }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getAllByText(/구매일/).length).toBeGreaterThan(0);
});

test("반응 남기기를 누르면 그 제품의 반응 시트가 열린다", () => {
  renderView("?tab=products");

  fireEvent.click(screen.getByRole("button", { name: "베터 글루코사민 반응 남기기" }));
  expect(screen.getByText("코코에게 잘 맞았나요?")).toBeDefined();
  expect(screen.getByRole("radio", { name: "잘 맞았어요" })).toBeDefined();
});

test("아이를 고르면 그 아이가 선택 상태가 된다", () => {
  renderView();

  const [first, second] = screen.getAllByRole("radio");
  expect(first.getAttribute("aria-checked")).toBe("true");

  fireEvent.click(second);
  expect(second.getAttribute("aria-checked")).toBe("true");
  expect(first.getAttribute("aria-checked")).toBe("false");
});

test("새 아이 추가는 온보딩 기본 정보 단계로 간다", () => {
  renderView();

  fireEvent.click(screen.getByRole("button", { name: "새 아이 추가" }));
  expect(push).toHaveBeenCalledWith("/onboarding?step=basic");
});

test("아이 제품을 반응 입력 여부로 거른다", () => {
  // 목업 넷 중 둘만 반응을 남겼다
  renderView("?tab=products&reviewed=todo");
  expect(screen.getAllByRole("button", { name: /반응 남기기/ })).toHaveLength(2);
});
