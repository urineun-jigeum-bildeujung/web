// 탭마다 무엇이 붙는지, 거르기가 목록을 줄이는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { LikesView } from "./likes-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <LikesView />
    </NuqsTestingAdapter>,
  );
}

describe("LikesView", () => {
  it("찜 탭에만 종류 거르기가 있다", () => {
    renderWith();
    expect(screen.getByLabelText("상품 종류 고르기")).toBeDefined();
  });

  it("찜 탭에서 종류를 고르면 그 종류만 남는다", () => {
    renderWith("?tab=liked&category=snack");
    // 목업에서 간식은 하나뿐이다
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
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

  it("주소에 없는 종류가 오면 전체로 떨어진다", () => {
    renderWith("?tab=liked&category=legacy");

    // 걸러 낸 결과가 비면 목록이 통째로 사라진다
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
