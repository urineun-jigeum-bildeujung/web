// 나의 상품 후기 테스트. 탭 전환과 목록 표시를 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { MOCK_WRITABLE, MOCK_WRITTEN } from "../model/mock-reviews";
import { MyReviewsView } from "./my-reviews-view";

function renderAt(search: string, { writable = MOCK_WRITABLE, written = MOCK_WRITTEN } = {}) {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MyReviewsView writable={writable} written={written} />
    </NuqsTestingAdapter>,
  );
}

test("기본은 작성 가능한 리뷰 탭이다", () => {
  renderAt("");

  const tab = screen.getByRole("tab", { name: "작성 가능한 리뷰" });
  expect(tab.getAttribute("aria-selected")).toBe("true");

  const links = screen.getAllByRole("link", { name: "후기 남기기" });
  expect(links.length).toBeGreaterThan(0);
  expect(links[0].getAttribute("href")).toBe("/mypage/reviews/write?orderItemId=0");
});

test("URL로 작성한 리뷰 탭을 열 수 있다", () => {
  renderAt("?tab=written");

  expect(screen.getByRole("tab", { name: "작성한 리뷰" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(screen.getAllByText("5점 만점에 4점").length).toBeGreaterThan(0);
});

test("작성한 리뷰를 누르면 상세로 이어진다", () => {
  renderAt("?tab=written");

  const links = screen.getAllByRole("link", { name: /상품명/ });
  expect(links[0].getAttribute("href")).toBe("/mypage/reviews/0");
});

// 목록이 늘 차 있어 빈 상태가 화면에서 도달하지 않았다. 조회 결과를 받도록 바꿔 덮는다(#159)
test("쓸 수 있는 후기가 없으면 그 사실을 알린다", () => {
  renderAt("", { writable: [] });

  expect(screen.getByText("작성할 수 있는 후기가 없어요")).toBeDefined();
});

test("쓴 후기가 없으면 그 사실을 알린다", () => {
  renderAt("?tab=written", { written: [] });

  expect(screen.getByText("작성한 후기가 없어요")).toBeDefined();
});
