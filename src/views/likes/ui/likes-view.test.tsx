// 탭마다 무엇이 붙는지, 거르기가 목록을 줄이는지 본다.
import { render, screen } from "@testing-library/react";
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
    expect(screen.getAllByRole("button", { name: "구매하기" })).toHaveLength(4);
  });

  it("빼기는 확인창을 거친다", () => {
    renderWith("?tab=recent");

    // 최근 본 탭은 X로 지운다. 누르자마자 사라지면 되돌릴 수 없다
    expect(screen.getAllByLabelText(/목록에서 빼기/)).toHaveLength(4);
  });
});
