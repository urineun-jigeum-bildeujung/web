// 탭마다 무엇이 붙는지, 카테고리로 거르기가 목록을 줄이는지 본다.
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
  it("찜 탭에만 카테고리 거르기가 있다", () => {
    const { unmount } = renderWith();
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
    unmount();

    renderWith("?tab=recent");
    expect(screen.queryByLabelText("상품 분류")).toBeNull();
  });

  it("찜 탭에서 사료만 고르면 그것만 남는다", () => {
    renderWith("?tab=liked&category=food");
    // 목업에서 사료는 둘이다
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("주소에 없는 카테고리가 오면 전체로 떨어진다", () => {
    renderWith("?tab=liked&category=legacy");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("최근에 봤어요·자주 샀어요 탭은 눌러도 반응하지 않는다", () => {
    renderWith();

    fireEvent.click(screen.getByRole("tab", { name: "최근에 봤어요" }));

    // MVP 범위 밖이라 탭 전환 없이 찜 탭 내용이 그대로 남는다
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
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

  it("찜을 풀면 확인 없이 바로 목록에서 빠진다", () => {
    renderWith("?tab=liked");

    // 취소 기능이 없어 확인 모달이 뜨면 오히려 방해된다는 판단으로 뺐다(#274 QA 답변)
    fireEvent.click(screen.getAllByLabelText(/찜 풀기/)[0]);

    expect(screen.queryByRole("button", { name: "지우기" })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  // 빈 상태 시안(2022-158710)엔 칩 줄이 없다. 거른 결과가 빈 것과는 다르다
  it("찜한 상품이 하나도 없으면 카테고리 칩도 감춘다", () => {
    renderWith("?tab=liked");

    for (const button of screen.getAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
    }

    expect(screen.queryByLabelText("상품 분류")).toBeNull();
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
