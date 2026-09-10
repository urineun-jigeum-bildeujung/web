// 상품 비교 테스트. 자리가 비면 무엇이 달라지는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/compare",
}));

import { ProductCompareView } from "./product-compare-view";

function renderView(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <ProductCompareView />
    </NuqsTestingAdapter>,
  );
}

test("두 자리가 차 있으면 비교표를 보여준다", () => {
  renderView();
  expect(screen.getByRole("table")).toBeDefined();
});

test("한 자리를 비우면 견줄 것이 없어 표가 사라진다", () => {
  renderView();

  fireEvent.click(screen.getAllByRole("button", { name: /비교에서 빼기/ })[0]);

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByText(/여기에 담아주세요/)).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

// 시안 comp_001_에러. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라 견줄 수 없다
test("종류가 다른 둘을 담으면 표 대신 안내가 나온다", () => {
  // 자리 1에 간식(저자극 덴탈껌)을 담는다. 자리 0은 사료다
  renderView("?slot=1&product=5");

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByText(/건식은 건식끼리/)).toBeDefined();
});

test("같은 종류끼리는 표가 그대로 보인다", () => {
  renderView("?slot=1&product=3");

  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.queryByText(/건식은 건식끼리/)).toBeNull();
});

test("하단 이동 줄에서 현재 화면을 알린다", () => {
  renderView();

  const current = screen.getByRole("link", { name: "상품비교" });
  expect(current.getAttribute("aria-current")).toBe("page");
});
