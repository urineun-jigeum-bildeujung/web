// 리뷰 탭 테스트. 맞춤보기가 실제로 거르는지, 정렬이 순서를 바꾸는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/products/1",
}));

import { ReviewPanel } from "./review-panel";

function renderPanel(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <ReviewPanel rating={4.8} reviewCount={108} petProfileLabel="말티즈 · 8세 · 4kg" />
    </NuqsTestingAdapter>,
  );
}

describe("ReviewPanel", () => {
  it("후기가 목록으로 보이고 아이 프로필이 함께 읽힌다", () => {
    renderPanel();

    // 별점만 나열하면 4kg 말티즈와 28kg 리트리버의 후기가 같아 보인다
    expect(screen.getByText("말티즈 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText("리트리버 · 6세 · 28kg")).toBeDefined();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(1);
  });

  it("사용 기간과 재구매 횟수가 칩으로 보인다", () => {
    renderPanel();

    expect(screen.getByText("사용 3주차")).toBeDefined();
    expect(screen.getByText("재구매 2회")).toBeDefined();
  });

  // 시안 구조도가 필터를 자동(토글)과 수동(바텀시트) 둘로 나눠 적었다
  it("맞춤보기를 켜면 같은 품종의 후기만 남는다", () => {
    renderPanel();
    expect(screen.getByText("리트리버 · 6세 · 28kg")).toBeDefined();

    fireEvent.click(screen.getByRole("switch"));

    expect(screen.queryByText("리트리버 · 6세 · 28kg")).toBeNull();
    expect(screen.getByText("말티즈 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText("말티즈와 함께 쓴 후기만 보고 있어요")).toBeDefined();
  });

  it("맞춤보기가 켜져 있어도 끄면 모든 후기가 돌아온다", () => {
    renderPanel("?reviewMatch=on");
    expect(screen.queryByText("리트리버 · 6세 · 28kg")).toBeNull();

    fireEvent.click(screen.getByRole("switch"));

    expect(screen.getByText("리트리버 · 6세 · 28kg")).toBeDefined();
  });

  it("별점 낮은순으로 바꾸면 가장 낮은 후기가 맨 위에 온다", () => {
    renderPanel("?reviewSort=rating-low");

    const first = screen.getAllByRole("article")[0];
    expect(first.textContent).toContain("밤이맘");
  });

  it("추천순은 도움돼요가 많은 후기가 맨 위에 온다", () => {
    renderPanel();

    const first = screen.getAllByRole("article")[0];
    expect(first.textContent).toContain("초코집사");
  });
});
