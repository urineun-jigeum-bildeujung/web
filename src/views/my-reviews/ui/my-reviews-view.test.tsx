// 나의 상품 후기 테스트. 탭 전환과 목록 표시를 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { MyReviewsView } from "./my-reviews-view";

function renderAt(search: string) {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MyReviewsView />
    </NuqsTestingAdapter>,
  );
}

test("기본은 작성 가능한 리뷰 탭이다", () => {
  renderAt("");

  const tab = screen.getByRole("tab", { name: "작성 가능한 리뷰" });
  expect(tab.getAttribute("aria-selected")).toBe("true");
  expect(screen.getAllByRole("button", { name: "후기 남기기" }).length).toBeGreaterThan(0);
});

test("URL로 작성한 리뷰 탭을 열 수 있다", () => {
  renderAt("?tab=written");

  expect(screen.getByRole("tab", { name: "작성한 리뷰" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(screen.getAllByText("5점 만점에 4점").length).toBeGreaterThan(0);
});
