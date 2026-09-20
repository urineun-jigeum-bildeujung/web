// 적합도가 점수만이 아니라 문장으로도 읽히는지, 아이를 바꿀 수 있는지 본다.
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/recommendations",
}));

import { RecommendationsView } from "./recommendations-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <RecommendationsView />
    </NuqsTestingAdapter>,
  );
}

describe("RecommendationsView", () => {
  it("어느 아이 기준인지 고를 수 있다", () => {
    renderWith();
    expect(screen.getByLabelText("어느 아이의 추천을 볼지")).toBeDefined();
  });

  it("주소로 받은 아이가 적합도 문장에 들어간다", () => {
    renderWith("?pet=2");

    // 점수만 보여주면 누구 기준인지 알 수 없다
    expect(screen.getAllByText(/봄이와 적합도 \d+점/)[0]).toBeDefined();
  });

  it("무엇을 근거로 골랐는지 알린다", () => {
    renderWith();
    expect(screen.getByText(/건강 고민을 바탕으로 추천해요/)).toBeDefined();
  });

  it("분류를 바꾸면 목록도 바뀐다", () => {
    const { unmount } = renderWith("?category=food");
    const food = screen.getAllByRole("listitem").map((el) => el.textContent);
    unmount();

    renderWith("?category=snack");
    const snack = screen.getAllByRole("listitem").map((el) => el.textContent);

    // 탭을 눌러도 같은 목록이면 거른 것이 아니다
    expect(food).not.toEqual(snack);
  });

  it("전체 탭은 모든 분류를 보여준다", () => {
    const { unmount } = renderWith("?category=food");
    const food = screen.getAllByRole("listitem").length;
    unmount();

    renderWith("?category=all");
    const all = screen.getAllByRole("listitem").length;

    expect(all).toBeGreaterThan(food);
  });

  // 메인 "맞춤 추천" 더보기로 들어오는 서브 화면이라 뒤로가기가 있어야 한다.
  // 시안 헤더(로고형)와 다르게 유지하기로 한 것을 여기서 고정해 둔다(#273)
  it("머리말에 뒤로가기와 제목이 있다", () => {
    renderWith();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "맞춤 추천" })).toBeDefined();
  });

  // 정렬은 분류와 같이 주소에 남아야 한다. 상품 상세에 갔다 돌아와도 유지돼야 하기 때문이다
  it("주소로 받은 정렬 기준대로 목록을 늘어놓는다", () => {
    renderWith("?sort=rating-low");
    const low = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(low[0]).toMatch(/적합도 57점/);
  });
});
