// 최근 검색어를 지울 수 있는지, 글자를 넣으면 추천어가 자리를 넘겨받는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRecentCache } from "../model/recent-keywords";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/search",
}));

import { SearchView } from "./search-view";

function renderView(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <SearchView />
    </NuqsTestingAdapter>,
  );
}

describe("SearchView", () => {
  // 최근 검색어를 기기에 남기므로 앞 테스트가 뒤 테스트로 새어 나간다
  beforeEach(() => {
    window.localStorage.clear();
    resetRecentCache();
  });

  it("들어오면 최근 검색어와 카테고리를 보인다", () => {
    renderView();

    expect(screen.getByText("최근 검색어")).toBeDefined();
    expect(screen.getByText("카테고리로 둘러보기")).toBeDefined();
  });

  it("최근 검색어를 하나씩 지운다", () => {
    renderView();

    fireEvent.click(screen.getByLabelText("양치 껌 검색 기록 지우기"));

    expect(screen.queryByRole("button", { name: "양치 껌" })).toBeNull();
    // 나머지는 남는다
    expect(screen.getByRole("button", { name: "사료" })).toBeDefined();
  });

  it("전체삭제를 누르면 비었다고 알린다", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "전체삭제" }));

    expect(screen.getByText("최근에 검색한 내역이 없어요")).toBeDefined();
    // 지울 것이 없으면 전체삭제도 사라진다
    expect(screen.queryByRole("button", { name: "전체삭제" })).toBeNull();
  });

  it("글자를 넣으면 최근 검색어 대신 추천어가 나온다", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "중소형" } });

    expect(screen.getByRole("list", { name: "추천 검색어" })).toBeDefined();
    expect(screen.queryByText("최근 검색어")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("추천어에서 입력한 부분만 강조한다", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "중소형" } });

    // 색만으로 알리지 않도록 strong으로 굵기도 함께 준다
    const marks = document.querySelectorAll("strong");
    expect(marks).toHaveLength(3);
    expect(marks[0].textContent).toBe("중소형");
  });

  it("추천어를 고르면 최근 검색어 맨 앞에 남는다", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "관절" } });
    fireEvent.click(screen.getByRole("button", { name: "중소형견 관절 영양제" }));

    const chips = screen.getAllByRole("listitem");
    expect(chips[0].textContent).toContain("중소형견 관절 영양제");
  });

  it("검색하면 그 말로 검색 결과 화면에 간다", () => {
    renderView();

    fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "관절" } });
    fireEvent.click(screen.getByRole("button", { name: "중소형견 관절 영양제" }));

    // 띄어쓰기가 든 말이라 그대로 붙이면 주소가 깨진다
    expect(push).toHaveBeenCalledWith(
      "/search/result?q=%EC%A4%91%EC%86%8C%ED%98%95%EA%B2%AC%20%EA%B4%80%EC%A0%88%20%EC%98%81%EC%96%91%EC%A0%9C",
    );
  });

  // 비교 화면이 자리를 채우러 보낸 경우. 고른 뒤 갈 곳이 달라 맥락을 알린다
  it("비교할 자리를 채우러 왔으면 그 자리를 결과 화면까지 들고 간다", () => {
    renderView("?slot=1");

    expect(screen.getByText("비교할 상품을 검색해 주세요")).toBeDefined();

    fireEvent.change(screen.getByLabelText("상품 검색"), { target: { value: "덴탈껌" } });
    fireEvent.click(screen.getByRole("button", { name: "저자극 덴탈껌" }));

    expect(push).toHaveBeenCalledWith(
      "/search/result?q=%EC%A0%80%EC%9E%90%EA%B7%B9%20%EB%8D%B4%ED%83%88%EA%BB%8C&slot=1",
    );
  });

  it("최근 검색어를 다시 눌러도 목록에 하나만 남는다", () => {
    renderView();

    // 목록 세 번째에 있던 말을 다시 검색한다
    fireEvent.click(screen.getByRole("button", { name: "사료" }));

    expect(screen.getAllByRole("button", { name: "사료" })).toHaveLength(1);
    // 맨 앞으로 올라온다
    expect(screen.getAllByRole("listitem")[0].textContent).toContain("사료");
  });
});
