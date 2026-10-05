// useMutateReviewRecommend 훅 테스트. 누르면 목록·상세의 그 후기를 함께 먼저 바꾸고, 실패하면 되돌리며,
// 끝나면 상세만 다시 받고 목록은 낡았다고만 두는지 본다.
import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const { toggleReviewRecommend } = vi.hoisted(() => ({ toggleReviewRecommend: vi.fn() }));
vi.mock("./reviews", () => ({ toggleReviewRecommend }));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { Review } from "../model/review";

import type { ProductReviewPage, ReviewDetail } from "./reviews";
import { useMutateReviewRecommend } from "./use-mutate-review-recommend";

function review(id: string, likeCount: number, liked: boolean): Review {
  return {
    id,
    nickname: "댕댕이맘",
    pets: [],
    rating: 4.5,
    date: "2026. 09. 27",
    images: [],
    tags: ["사용 3주째"],
    content: "잘 먹어요",
    likeCount,
    liked,
  };
}

const DETAIL: ReviewDetail = {
  id: "7",
  isMine: false,
  nickname: "댕댕이맘",
  product: { id: "1", name: "관절 튼튼 영양제 90정" },
  pets: [],
  rating: 4.5,
  usageDays: 21,
  repurchaseCount: 0,
  goodPoints: [],
  badPoints: [],
  content: "잘 먹어요",
  images: [],
  likeCount: 32,
  liked: false,
  createdAt: "2026-09-27",
};

const KEYS = {
  recommend: QUERY_KEYS.review.byProduct("1", { sort: "recommend" }),
  recent: QUERY_KEYS.review.byProduct("1", { sort: "recent" }),
  photos: QUERY_KEYS.review.photos("1"),
  featured: QUERY_KEYS.review.featuredPhotos("1"),
  detail: QUERY_KEYS.review.detail("7"),
};

function pages(...reviews: Review[]): InfiniteData<ProductReviewPage> {
  return {
    pages: [{ averageRating: 4.3, totalCount: reviews.length, reviews }],
    pageParams: [0],
  };
}

/** 7번 후기가 두 정렬의 목록과 상세에 있고, 9번은 이미 누른 후기다. 사진 캐시도 같은 뿌리 아래 있다 */
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(KEYS.recommend, pages(review("7", 32, false), review("9", 51, true)));
  client.setQueryData(KEYS.recent, pages(review("9", 51, true), review("7", 32, false)));
  client.setQueryData(KEYS.photos, {
    pages: [{ totalCount: 1, photos: [{ reviewId: "7", imageUrl: "a" }], hasNext: false }],
    pageParams: [0],
  });
  client.setQueryData(KEYS.featured, [{ reviewId: "7", imageUrl: "a" }]);
  client.setQueryData(KEYS.detail, DETAIL);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMutateReviewRecommend(), { wrapper });

  /** 그 목록 캐시에서 한 후기의 눌림과 수 */
  const inList = (key: readonly unknown[], id: string) => {
    const found = client
      .getQueryData<InfiniteData<ProductReviewPage>>(key)
      ?.pages.flatMap((page) => page.reviews)
      .find((item) => item.id === id);
    return found && { liked: found.liked, likeCount: found.likeCount };
  };
  const inDetail = () => {
    const detail = client.getQueryData<ReviewDetail>(KEYS.detail);
    return detail && { liked: detail.liked, likeCount: detail.likeCount };
  };

  return { client, result, inList, inDetail };
}

afterEach(() => {
  vi.clearAllMocks();
});

test("누르면 두 정렬의 목록과 상세에서 그 후기를 함께 켜고 수를 하나 올린다", async () => {
  toggleReviewRecommend.mockResolvedValue(undefined);
  const { result, inList, inDetail } = setup();

  result.current.toggle("7", true);

  await waitFor(() => expect(inList(KEYS.recommend, "7")).toEqual({ liked: true, likeCount: 33 }));
  expect(inList(KEYS.recent, "7")).toEqual({ liked: true, likeCount: 33 });
  expect(inDetail()).toEqual({ liked: true, likeCount: 33 });
  // 다른 후기는 건드리지 않는다
  expect(inList(KEYS.recommend, "9")).toEqual({ liked: true, likeCount: 51 });
  expect(toggleReviewRecommend).toHaveBeenCalledWith("7");
});

test("이미 누른 후기를 다시 누르면 끄고 수를 하나 내린다", async () => {
  toggleReviewRecommend.mockResolvedValue(undefined);
  const { result, inList } = setup();

  result.current.toggle("9", false);

  await waitFor(() => expect(inList(KEYS.recommend, "9")).toEqual({ liked: false, likeCount: 50 }));
  expect(inList(KEYS.recent, "9")).toEqual({ liked: false, likeCount: 50 });
});

// 사진·대표 사진도 같은 뿌리(`byProductAll`) 아래 있다. 후기 줄이 없는 모양을 건드리면 깨진다
test("같은 뿌리 아래의 사진 캐시는 그대로 둔다", async () => {
  toggleReviewRecommend.mockResolvedValue(undefined);
  const { client, result, inList } = setup();
  const photos = client.getQueryData(KEYS.photos);
  const featured = client.getQueryData(KEYS.featured);

  result.current.toggle("7", true);

  await waitFor(() => expect(inList(KEYS.recommend, "7")?.liked).toBe(true));
  expect(client.getQueryData(KEYS.photos)).toBe(photos);
  expect(client.getQueryData(KEYS.featured)).toBe(featured);
});

test("실패하면 목록과 상세 모두 누르기 전으로 되돌린다", async () => {
  toggleReviewRecommend.mockRejectedValue(new Error("네트워크 오류"));
  const { result, inList, inDetail } = setup();

  result.current.toggle("7", true);

  await waitFor(() => expect(toggleReviewRecommend).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(inList(KEYS.recommend, "7")).toEqual({ liked: false, likeCount: 32 }));
  expect(inList(KEYS.recent, "7")).toEqual({ liked: false, likeCount: 32 });
  expect(inDetail()).toEqual({ liked: false, likeCount: 32 });
});

// 추천순은 도움돼요 수로 줄을 세운다. 누르자마자 다시 받으면 읽던 후기가 자리를 옮긴다
test("끝나면 상세는 다시 받고 목록은 낡았다고만 표시한다", async () => {
  toggleReviewRecommend.mockResolvedValue(undefined);
  const { client, result } = setup();
  const invalidate = vi.spyOn(client, "invalidateQueries");

  result.current.toggle("7", true);

  await waitFor(() => expect(client.getQueryState(KEYS.detail)?.isInvalidated).toBe(true));
  expect(client.getQueryState(KEYS.recommend)?.isInvalidated).toBe(true);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.review.detailAll() });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: QUERY_KEYS.review.byProductAll(),
    refetchType: "none",
  });
});

// 앞 요청이 반영되기 전의 값을 받아 덮으면 방금 누른 후기가 되돌아간다
test("연달아 누르면 마지막 요청이 끝났을 때만 다시 받는다", async () => {
  let finishFirst!: () => void;
  toggleReviewRecommend.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishFirst = resolve;
      }),
  );
  toggleReviewRecommend.mockResolvedValueOnce(undefined);
  const { client, result } = setup();
  const invalidate = vi.spyOn(client, "invalidateQueries");

  result.current.toggle("7", true);
  result.current.toggle("9", false);

  await waitFor(() => expect(toggleReviewRecommend).toHaveBeenCalledTimes(2));
  // 두 번째가 끝나도 첫 요청이 남아 있다
  await waitFor(() => expect(client.isMutating()).toBe(1));
  expect(invalidate).not.toHaveBeenCalled();

  finishFirst();
  await waitFor(() => expect(invalidate).toHaveBeenCalled());
});
