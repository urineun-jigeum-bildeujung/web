// 탭마다 무엇이 붙는지, 알림 상태로 거르기가 목록을 줄이는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/likes",
}));

import { LikesView } from "./likes-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <LikesView />
    </NuqsTestingAdapter>,
  );
}

describe("LikesView", () => {
  it("찜 탭에만 알림 상태 거르기가 있다", () => {
    const { unmount } = renderWith();
    expect(screen.getByLabelText("알림 상태 고르기")).toBeDefined();
    unmount();

    renderWith("?tab=recent");
    expect(screen.queryByLabelText("알림 상태 고르기")).toBeNull();
  });

  it("찜 탭에서 새 알림만 고르면 그것만 남는다", () => {
    renderWith("?tab=liked&notice=new");
    // 목업에서 새 알림은 둘이다
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("주소에 없는 알림 상태가 오면 전체로 떨어진다", () => {
    renderWith("?tab=liked&notice=legacy");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("자주 산 탭에는 구매 횟수와 살 수 있는 버튼이 붙는다", () => {
    renderWith("?tab=often");

    expect(screen.getByText("마지막 구매 2주 전")).toBeDefined();
    expect(screen.getByText("4회 구매")).toBeDefined();
    // 이제 이동이라 버튼이 아니라 링크다
    expect(screen.getAllByRole("link", { name: "구매하기" })).toHaveLength(4);
    expect(screen.getAllByRole("link", { name: "장바구니" })[0].getAttribute("href")).toBe("/cart");
  });

  it("빼기는 확인창을 거친다", () => {
    renderWith("?tab=recent");

    // 최근 본 탭은 X로 지운다. 누르자마자 사라지면 되돌릴 수 없다
    expect(screen.getAllByLabelText(/목록에서 빼기/)).toHaveLength(4);
  });

  it("찜을 풀면 목록에서 빠진다", () => {
    renderWith("?tab=liked");

    fireEvent.click(screen.getAllByLabelText(/찜 풀기/)[0]);
    fireEvent.click(screen.getByRole("button", { name: "지우기" }));

    // 하트만 비우고 목록에 남기면 푼 것이 아니다
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  // 빈 상태 시안(2022-158710)엔 칩 줄이 없다. 거른 결과가 빈 것과는 다르다
  it("찜한 상품이 하나도 없으면 알림 상태 칩도 감춘다", () => {
    renderWith("?tab=liked");

    for (const button of screen.getAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
      fireEvent.click(screen.getByRole("button", { name: "지우기" }));
    }

    expect(screen.queryByLabelText("알림 상태 고르기")).toBeNull();
    expect(screen.getByText("아직 담아둔 상품이 없어요")).toBeDefined();
  });

  // /likes는 바텀내비 탭 루트라 홈과 같은 로고형 헤더를 쓴다(#274). 뒤로가기 있는
  // PageHeader가 아니라는 것을 여기서 고정해 둔다
  it("머리말이 로고형이다 — 뒤로가기 없이 검색·알림·장바구니로 이동한다", () => {
    renderWith();

    expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
    expect(screen.getByRole("link", { name: "검색" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
    expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  });

  it("하단 이동 줄에서 현재 화면을 알린다", () => {
    renderWith();

    const current = screen.getByRole("link", { name: "좋아요" });
    expect(current.getAttribute("aria-current")).toBe("page");
  });
});
