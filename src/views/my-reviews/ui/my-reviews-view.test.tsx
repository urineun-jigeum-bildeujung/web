// 나의 상품 후기 테스트. 탭 전환과 목록 표시, 작성한 탭이 서버 응답의 네 상태를 가르는지 본다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { MyReviewItem } from "@/entities/review";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

// 무엇을 부르고 어떻게 옮기는지는 `entities/review/api/reviews.test.ts`가 본다. 여기서는 상태만 세운다
const useQueryMyReviews = vi.fn();
vi.mock("@/entities/review", () => ({
  useQueryMyReviews: () => useQueryMyReviews(),
}));

import { MOCK_WRITABLE } from "../model/mock-reviews";
import { MyReviewsView } from "./my-reviews-view";

const WRITTEN: MyReviewItem[] = [
  {
    id: "0",
    productId: "7",
    name: "멍 바나나스낵 45g 강아지간식",
    rating: 4,
    content: "코코가 엄청 잘 먹어요",
    createdAt: "2026-07-20",
  },
];

const loaded = (reviews: MyReviewItem[] | undefined, error: unknown = null) => ({
  reviews,
  hasNext: false,
  isLoading: false,
  isRetrying: false,
  error,
  refetch: vi.fn(),
});

function renderAt(search: string, { writable = MOCK_WRITABLE } = {}) {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MyReviewsView writable={writable} />
    </NuqsTestingAdapter>,
  );
}

test("기본은 작성 가능한 리뷰 탭이고 작성한 목록은 부르지 않는다", () => {
  useQueryMyReviews.mockReturnValue(loaded(WRITTEN));
  renderAt("");

  const tab = screen.getByRole("tab", { name: "작성 가능한 리뷰" });
  expect(tab.getAttribute("aria-selected")).toBe("true");

  const links = screen.getAllByRole("link", { name: "후기 남기기" });
  expect(links.length).toBeGreaterThan(0);
  expect(links[0].getAttribute("href")).toBe("/mypage/reviews/write?productId=0");
  // 안 보는 탭의 목록을 미리 받지 않는다
  expect(useQueryMyReviews).not.toHaveBeenCalled();
});

test("URL로 작성한 리뷰 탭을 열면 서버에서 받은 후기를 작성일과 함께 보인다", () => {
  useQueryMyReviews.mockReturnValue(loaded(WRITTEN));
  renderAt("?tab=written");

  expect(screen.getByRole("tab", { name: "작성한 리뷰" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(screen.getByText("5점 만점에 4점")).toBeDefined();
  // 응답에 구매일이 없어 작성일을 시안의 자리에 보인다
  expect(screen.getByText("작성일 26.07.20")).toBeDefined();
});

test("작성한 리뷰를 누르면 상세로 이어진다", () => {
  useQueryMyReviews.mockReturnValue(loaded(WRITTEN));
  renderAt("?tab=written");

  const links = screen.getAllByRole("link", { name: /멍 바나나스낵/ });
  expect(links[0].getAttribute("href")).toBe("/mypage/reviews/0");
});

// 목록이 늘 차 있어 빈 상태가 화면에서 도달하지 않았다. 조회 결과를 받도록 바꿔 덮는다(#159)
test("쓸 수 있는 후기가 없으면 그 사실을 알린다", () => {
  renderAt("", { writable: [] });

  expect(screen.getByText("지금은 작성할 수 있는 후기가 없어요")).toBeDefined();
});

test("쓴 후기가 없으면 그 사실을 알린다", () => {
  useQueryMyReviews.mockReturnValue(loaded([]));
  renderAt("?tab=written");

  expect(screen.getByText("아직 작성한 후기가 없어요")).toBeDefined();
});

test("받는 동안은 자리를 잡아 두고, 못 받으면 다시 시도할 수 있다", () => {
  useQueryMyReviews.mockReturnValue({ ...loaded(undefined), isLoading: true });
  const first = renderAt("?tab=written");
  expect(screen.getByLabelText("작성한 리뷰를 불러오는 중")).toBeDefined();
  first.unmount();

  const failed = loaded(undefined, new Error("500"));
  useQueryMyReviews.mockReturnValue(failed);
  renderAt("?tab=written");
  expect(screen.getByText("후기를 불러오지 못했어요")).toBeDefined();
  screen.getByRole("button", { name: "다시 시도" }).click();
  expect(failed.refetch).toHaveBeenCalled();
});
