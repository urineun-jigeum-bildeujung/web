// 나의 상품 후기 테스트. 탭 전환과 두 탭이 각각 서버 응답의 네 상태를 가르는지 본다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { MyReviewItem, WritableReview } from "@/entities/review";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

// 무엇을 부르고 어떻게 옮기는지는 `entities/review/api/reviews.test.ts`가 본다. 여기서는 상태만 세운다
const useQueryMyReviews = vi.fn();
const useQueryWritableReviews = vi.fn();
vi.mock("@/entities/review", () => ({
  useQueryMyReviews: () => useQueryMyReviews(),
  useQueryWritableReviews: () => useQueryWritableReviews(),
}));

import { MyReviewsView } from "./my-reviews-view";

const WRITABLE: WritableReview[] = [
  {
    orderProductId: "12",
    productId: "7",
    name: "저자극 덴탈껌 14개입",
    confirmedAt: "2026-08-28T15:43:00+09:00",
  },
];

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

const state = <T,>(data: T | undefined, error: unknown = null) => ({
  isLoading: false,
  isRetrying: false,
  error,
  refetch: vi.fn(),
  data,
});

const writableLoaded = (items: WritableReview[] | undefined, error: unknown = null) => {
  const { data, ...rest } = state(items, error);
  return { items: data, ...rest };
};

const writtenLoaded = (reviews: MyReviewItem[] | undefined, error: unknown = null) => {
  const { data, ...rest } = state(reviews, error);
  return { reviews: data, hasNext: false, ...rest };
};

function renderAt(search: string) {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MyReviewsView />
    </NuqsTestingAdapter>,
  );
}

test("기본은 작성 가능한 리뷰 탭이고 작성한 목록은 부르지 않는다", () => {
  useQueryWritableReviews.mockReturnValue(writableLoaded(WRITABLE));
  useQueryMyReviews.mockReturnValue(writtenLoaded(WRITTEN));
  renderAt("");

  const tab = screen.getByRole("tab", { name: "작성 가능한 리뷰" });
  expect(tab.getAttribute("aria-selected")).toBe("true");

  // 응답의 상품 id로 작성 화면에 간다
  const link = screen.getByRole("link", { name: "후기 남기기" });
  expect(link.getAttribute("href")).toBe("/mypage/reviews/write?productId=7");
  // 응답에 주문일이 없어 구매확정 시각을 그 자리에 보인다. 기한은 없어 "N일 남음"을 그리지 않는다
  expect(screen.getByText("구매확정일 26.08.28")).toBeDefined();
  expect(screen.queryByText(/일 남음/)).toBeNull();
  // 안 보는 탭의 목록을 미리 받지 않는다
  expect(useQueryMyReviews).not.toHaveBeenCalled();
});

test("URL로 작성한 리뷰 탭을 열면 서버에서 받은 후기를 작성일과 함께 보이고 작성 가능 목록은 부르지 않는다", () => {
  useQueryWritableReviews.mockReset();
  useQueryMyReviews.mockReturnValue(writtenLoaded(WRITTEN));
  renderAt("?tab=written");

  expect(screen.getByRole("tab", { name: "작성한 리뷰" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(screen.getByText("5점 만점에 4점")).toBeDefined();
  // 응답에 구매일이 없어 작성일을 시안의 자리에 보인다
  expect(screen.getByText("작성일 26.07.20")).toBeDefined();
  expect(useQueryWritableReviews).not.toHaveBeenCalled();
});

test("작성한 리뷰를 누르면 상세로 이어진다", () => {
  useQueryMyReviews.mockReturnValue(writtenLoaded(WRITTEN));
  renderAt("?tab=written");

  const links = screen.getAllByRole("link", { name: /멍 바나나스낵/ });
  expect(links[0].getAttribute("href")).toBe("/mypage/reviews/0");
});

test("쓸 수 있는 후기가 없으면 그 사실을 알린다", () => {
  useQueryWritableReviews.mockReturnValue(writableLoaded([]));
  renderAt("");

  expect(screen.getByText("지금은 작성할 수 있는 후기가 없어요")).toBeDefined();
});

test("쓴 후기가 없으면 그 사실을 알린다", () => {
  useQueryMyReviews.mockReturnValue(writtenLoaded([]));
  renderAt("?tab=written");

  expect(screen.getByText("아직 작성한 후기가 없어요")).toBeDefined();
});

test("작성 가능 목록을 받는 동안은 자리를 잡아 두고, 못 받으면 다시 시도할 수 있다", () => {
  useQueryWritableReviews.mockReturnValue({ ...writableLoaded(undefined), isLoading: true });
  const first = renderAt("");
  expect(screen.getByLabelText("작성 가능한 리뷰를 불러오는 중")).toBeDefined();
  first.unmount();

  const failed = writableLoaded(undefined, new Error("500"));
  useQueryWritableReviews.mockReturnValue(failed);
  renderAt("");
  expect(screen.getByText("작성할 수 있는 후기를 불러오지 못했어요")).toBeDefined();
  screen.getByRole("button", { name: "다시 시도" }).click();
  expect(failed.refetch).toHaveBeenCalled();
});

test("작성한 목록을 받는 동안은 자리를 잡아 두고, 못 받으면 다시 시도할 수 있다", () => {
  useQueryMyReviews.mockReturnValue({ ...writtenLoaded(undefined), isLoading: true });
  const first = renderAt("?tab=written");
  expect(screen.getByLabelText("작성한 리뷰를 불러오는 중")).toBeDefined();
  first.unmount();

  const failed = writtenLoaded(undefined, new Error("500"));
  useQueryMyReviews.mockReturnValue(failed);
  renderAt("?tab=written");
  expect(screen.getByText("후기를 불러오지 못했어요")).toBeDefined();
  screen.getByRole("button", { name: "다시 시도" }).click();
  expect(failed.refetch).toHaveBeenCalled();
});
