// 검색어가 목록을 줄이는지, 걸리는 게 없을 때 무엇을 보이는지, 검색바가 어디로 보내는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/search/result",
}));

import { SearchResultView } from "./search-result-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <SearchResultView />
    </NuqsTestingAdapter>,
  );
}

describe("SearchResultView", () => {
  it("검색어에 걸린 상품만 보인다", () => {
    renderWith("?q=퍼피");

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("총 1개")).toBeDefined();
  });

  it("걸리는 게 없으면 없다고 알린다", () => {
    renderWith("?q=고양이모래");

    expect(screen.getByText("검색 결과가 없어요")).toBeDefined();
    // 셀 것이 없으니 개수와 정렬도 감춘다
    expect(screen.queryByLabelText("정렬")).toBeNull();
  });

  it("검색바를 누르면 검색 화면으로 되돌아간다", () => {
    renderWith("?q=사료");

    fireEvent.click(screen.getByRole("button", { name: /검색어 고치기/ }));

    expect(push).toHaveBeenCalledWith("/search");
  });

  // 비교 화면이 자리를 채우러 보낸 경우. 고르면 상세가 아니라 비교로 돌아간다
  it("비교할 자리를 채우러 왔으면 카드가 비교 화면으로 간다", () => {
    renderWith("?q=퍼피&slot=1");

    expect(screen.getByRole("link", { name: /퍼피 성장기 사료/ }).getAttribute("href")).toBe(
      "/compare?slot=1&product=4",
    );
    expect(screen.getByText("고르면 비교 화면으로 담아 드릴게요")).toBeDefined();
  });

  it("자리를 들고 검색어를 고치러 가도 자리를 잃지 않는다", () => {
    renderWith("?q=사료&slot=0");

    fireEvent.click(screen.getByRole("button", { name: /검색어 고치기/ }));

    expect(push).toHaveBeenCalledWith("/search?slot=0");
  });

  // 점수를 모르는 상품이 가격순 첫 줄에 오면 무엇을 기준으로 고르는지가 흐려진다
  it("적합도를 재지 못한 상품은 가장 싸도 마지막에 온다", () => {
    renderWith("?q=사료&sort=price-low");

    const items = screen.getAllByRole("listitem");
    const last = items[items.length - 1];

    expect(last.textContent).toContain("실속형 대용량 사료 5kg");
    expect(last.textContent).toContain("정보 확인 중");
    // 18,900원이라 퍼피(21,000원)보다 싸지만 위로 오지 않는다
    expect(items[0].textContent).not.toContain("실속형");
  });

  it("주소에 없는 정렬이 와도 목록이 비지 않는다", () => {
    // parseAsString이면 검증 없이 통과해 목록이 통째로 빈다
    renderWith("?q=사료&sort=아무거나");

    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
